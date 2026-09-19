using HrcTech.Domain.Constants;
using HrcTech.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HrcTech.Infrastructure.Persistence.Seed;

public sealed class AdminSeeder(
    AppDbContext db,
    UserManager<ApplicationUser> userManager,
    IConfiguration configuration,
    ILogger<AdminSeeder> logger)
{
    public async Task SeedAsync(CancellationToken ct = default)
    {
        // Idempotent: if any admin exists, do nothing.
        var admins = await userManager.GetUsersInRoleAsync(Roles.Admin);
        if (admins.Count > 0)
        {
            logger.LogInformation("Admin account already exists. Seed skipped.");
            return;
        }

        var email = configuration["ADMIN_EMAIL"]?.Trim();
        var password = configuration["ADMIN_PASSWORD"];
        var name = configuration["ADMIN_NAME"]?.Trim();

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            logger.LogError("ADMIN_EMAIL and ADMIN_PASSWORD are not configured. No admin account was created.");
            return;
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            Name = string.IsNullOrWhiteSpace(name) ? "HRC TECH Admin" : name,
            CreatedAt = DateTime.UtcNow
        };

        // User + role assignment succeed together or not at all.
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        try
        {
            var created = await userManager.CreateAsync(user, password);   // Identity hashes the password
            if (!created.Succeeded)
            {
                logger.LogError("Admin seed failed: {Errors}",
                    string.Join("; ", created.Errors.Select(e => e.Description)));
                return;
            }

            var roleResult = await userManager.AddToRoleAsync(user, Roles.Admin);
            if (!roleResult.Succeeded)
            {
                logger.LogError("Admin role assignment failed: {Errors}",
                    string.Join("; ", roleResult.Errors.Select(e => e.Description)));
                return;
            }

            await tx.CommitAsync(ct);
            logger.LogInformation("Admin account created for {Email}.", email);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Admin seed failed and was rolled back.");
        }
    }
}