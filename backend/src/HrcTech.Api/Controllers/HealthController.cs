using HrcTech.Api.Extensions;
using HrcTech.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HrcTech.Api.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var canConnect = await db.Database.CanConnectAsync(ct);
        return canConnect
            ? Ok(new { status = "Healthy", app = "HRC TECH API" })
            : StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = "Database is unavailable." });
    }

    // Temporary: proves the policy works. Removed once real admin endpoints exist (Phase 4).
    [HttpGet("admin")]
    [Authorize(Policy = PolicyNames.AdminOnly)]
    public IActionResult AdminPing() => Ok(new { message = "Admin access confirmed." });
}