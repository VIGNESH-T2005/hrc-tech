using System.Security.Claims;
using HrcTech.Api.Extensions;
using HrcTech.Application.DTOs.Auth;
using HrcTech.Application.Exceptions;
using HrcTech.Application.Interfaces;
using HrcTech.Application.Settings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace HrcTech.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService auth, IOptions<AuthOptions> authOptions) : ControllerBase
{
    private const string CookiePath = "/api/auth";
    private readonly AuthOptions _auth = authOptions.Value;

    [HttpPost("register")]
    [EnableRateLimiting(RateLimitPolicies.AuthStrict)]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken ct)
    {
        var user = await auth.RegisterAsync(request, ct);
        return StatusCode(StatusCodes.Status201Created, user);
    }

    [HttpPost("login")]
    [EnableRateLimiting(RateLimitPolicies.AuthStrict)]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken ct)
    {
        var result = await auth.LoginAsync(request, ct);
        SetRefreshCookie(result.RefreshToken, result.RefreshTokenExpiresAt);
        return Ok(result.Response);
    }

    [HttpPost("refresh")]
    [EnableRateLimiting(RateLimitPolicies.AuthRefresh)]
    public async Task<IActionResult> Refresh(CancellationToken ct)
    {
        Request.Cookies.TryGetValue(_auth.RefreshCookieName, out var token);

        try
        {
            var result = await auth.RefreshAsync(token, ct);
            SetRefreshCookie(result.RefreshToken, result.RefreshTokenExpiresAt);
            return Ok(result.Response);
        }
        catch (UnauthorizedException)
        {
            ClearRefreshCookie();
            throw;
        }
    }

    [HttpPost("logout")]
    [EnableRateLimiting(RateLimitPolicies.AuthRefresh)]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        Request.Cookies.TryGetValue(_auth.RefreshCookieName, out var token);
        await auth.LogoutAsync(token, ct);
        ClearRefreshCookie();
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        if (!Guid.TryParse(User.FindFirstValue("sub"), out var userId))
            return Unauthorized(new { message = "Authentication is required." });

        return Ok(await auth.GetCurrentUserAsync(userId, ct));
    }

    private void SetRefreshCookie(string token, DateTime expiresAtUtc) =>
        Response.Cookies.Append(_auth.RefreshCookieName, token, new CookieOptions
        {
            HttpOnly = true,
            Secure = _auth.RefreshCookieSecure,
            SameSite = ParseSameSite(),
            Path = CookiePath,            // the browser only sends it to /api/auth/*
            Expires = new DateTimeOffset(DateTime.SpecifyKind(expiresAtUtc, DateTimeKind.Utc)),
            IsEssential = true
        });

    private void ClearRefreshCookie() =>
        Response.Cookies.Delete(_auth.RefreshCookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = _auth.RefreshCookieSecure,
            SameSite = ParseSameSite(),
            Path = CookiePath
        });

    private SameSiteMode ParseSameSite() =>
        Enum.TryParse<SameSiteMode>(_auth.RefreshCookieSameSite, ignoreCase: true, out var mode) ? mode : SameSiteMode.Lax;
}