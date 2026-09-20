using System.Security.Cryptography;
using System.Text;
using HrcTech.Application.DTOs.Auth;
using HrcTech.Application.Exceptions;
using HrcTech.Application.Interfaces;
using HrcTech.Application.Settings;
using HrcTech.Domain.Constants;
using HrcTech.Domain.Entities;
using HrcTech.Infrastructure.Persistence;
using HrcTech.Infrastructure.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace HrcTech.Infrastructure.Auth;

public sealed class AuthService(
    AppDbContext db,
    UserManager<ApplicationUser> userManager,
    IJwtTokenService jwt,
    IOptions<JwtOptions> jwtOptions,
    IOptions<AuthOptions> authOptions,
    ILogger<AuthService> logger) : IAuthService
{
    private const string InvalidCredentials = "Invalid email or password.";
    private const string InvalidSession = "Your session has expired. Please sign in again.";
    private const string EmailTaken = "An account with this email already exists.";

    // A rotated token presented again within this window is treated as a parallel request, not theft.
    private static readonly TimeSpan ReuseGracePeriod = TimeSpan.FromSeconds(10);

    public async Task<UserDto> RegisterAsync(RegisterRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim();

        if (await userManager.FindByEmailAsync(email) is not null)
            throw new ConflictException(EmailTaken);

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            Name = request.Name.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        try
        {
            await using var tx = await db.Database.BeginTransactionAsync(ct);

            var created = await userManager.CreateAsync(user, request.Password);
            if (!created.Succeeded) throw ToException(created);

            // The role is decided by the server. Nothing in the request can influence it.
            var added = await userManager.AddToRoleAsync(user, Roles.Student);
            if (!added.Succeeded) throw ToException(added);

            await tx.CommitAsync(ct);
        }
        catch (DbUpdateException)
        {
            throw new ConflictException(EmailTaken);   // lost a race with another registration
        }

        logger.LogInformation("Student registered: {UserId}", user.Id);
        return ToDto(user, Roles.Student);
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken ct)
    {
        var user = await userManager.FindByEmailAsync(request.Email.Trim());

        if (user is null)
        {
            // Spend similar time as a real check so response timing doesn't reveal which emails exist.
            userManager.PasswordHasher.HashPassword(new ApplicationUser(), request.Password);
            throw new UnauthorizedException(InvalidCredentials);
        }

        if (await userManager.IsLockedOutAsync(user))
            throw new TooManyRequestsException("Too many failed attempts. Please try again later.");

        if (!await userManager.CheckPasswordAsync(user, request.Password))
        {
            await userManager.AccessFailedAsync(user);
            throw new UnauthorizedException(InvalidCredentials);
        }

        await userManager.ResetAccessFailedCountAsync(user);

        // Housekeeping: drop this user's long-expired refresh tokens.
        var cutoff = DateTime.UtcNow.AddDays(-1);
        await db.RefreshTokens.Where(t => t.UserId == user.Id && t.ExpiresAt < cutoff).ExecuteDeleteAsync(ct);

        var roles = await userManager.GetRolesAsync(user);
        var (raw, entity) = CreateRefreshToken(user.Id);
        db.RefreshTokens.Add(entity);
        await db.SaveChangesAsync(ct);

        return BuildResult(user, roles, raw, entity.ExpiresAt);
    }

    public async Task<AuthResult> RefreshAsync(string? refreshToken, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
            throw new UnauthorizedException(InvalidSession);

        var hash = Hash(refreshToken);
        var stored = await db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct)
            ?? throw new UnauthorizedException(InvalidSession);

        var now = DateTime.UtcNow;

        if (stored.RevokedAt is not null)
        {
            // An old, already-rotated token came back: assume it was stolen and end every session for that user.
            if (now - stored.RevokedAt.Value > ReuseGracePeriod)
            {
                await RevokeAllForUserAsync(stored.UserId, ct);
                logger.LogWarning("Refresh token reuse detected for user {UserId}. All sessions revoked.", stored.UserId);
            }
            throw new UnauthorizedException(InvalidSession);
        }

        if (stored.ExpiresAt <= now)
            throw new UnauthorizedException(InvalidSession);

        var user = await userManager.FindByIdAsync(stored.UserId.ToString());
        if (user is null || await userManager.IsLockedOutAsync(user))
            throw new UnauthorizedException(InvalidSession);

        var roles = await userManager.GetRolesAsync(user);
        var (raw, next) = CreateRefreshToken(user.Id);

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        // Atomic: only one concurrent request can rotate a given token.
        var rotated = await db.RefreshTokens
            .Where(t => t.Id == stored.Id && t.RevokedAt == null)
            .ExecuteUpdateAsync(s => s
                .SetProperty(t => t.RevokedAt, (DateTime?)now)
                .SetProperty(t => t.ReplacedByTokenId, (Guid?)next.Id), ct);

        if (rotated == 0)
            throw new UnauthorizedException(InvalidSession);

        db.RefreshTokens.Add(next);
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return BuildResult(user, roles, raw, next.ExpiresAt);
    }

    public async Task LogoutAsync(string? refreshToken, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(refreshToken)) return;

        var hash = Hash(refreshToken);
        var now = DateTime.UtcNow;

        await db.RefreshTokens
            .Where(t => t.TokenHash == hash && t.RevokedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.RevokedAt, (DateTime?)now), ct);
    }

    public async Task<UserDto> GetCurrentUserAsync(Guid userId, CancellationToken ct)
    {
        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new UnauthorizedException(InvalidSession);

        var roles = await userManager.GetRolesAsync(user);
        return ToDto(user, roles.FirstOrDefault() ?? string.Empty);
    }

    private async Task RevokeAllForUserAsync(Guid userId, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        await db.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.RevokedAt, (DateTime?)now), ct);
    }

    private AuthResult BuildResult(ApplicationUser user, IList<string> roles, string rawRefreshToken, DateTime refreshExpiresAt)
    {
        var accessToken = jwt.CreateAccessToken(user, roles);
        var response = new AuthResponse(
            accessToken,
            jwtOptions.Value.AccessTokenMinutes * 60,
            ToDto(user, roles.FirstOrDefault() ?? string.Empty));

        return new AuthResult(response, rawRefreshToken, refreshExpiresAt);
    }

    private (string Raw, RefreshToken Entity) CreateRefreshToken(Guid userId)
    {
        var raw = Convert.ToHexString(RandomNumberGenerator.GetBytes(64));
        var now = DateTime.UtcNow;

        var entity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TokenHash = Hash(raw),
            CreatedAt = now,
            ExpiresAt = now.AddDays(authOptions.Value.RefreshTokenDays)
        };

        return (raw, entity);
    }

    private static string Hash(string value) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));

    private static UserDto ToDto(ApplicationUser user, string role) =>
        new(user.Id, user.Name, user.Email ?? string.Empty, role, user.CreatedAt);

    private static AppException ToException(IdentityResult result)
    {
        if (result.Errors.Any(e => e.Code is "DuplicateEmail" or "DuplicateUserName"))
            return new ConflictException(EmailTaken);

        return new BadRequestException(string.Join(" ", result.Errors.Select(e => e.Description)));
    }
}