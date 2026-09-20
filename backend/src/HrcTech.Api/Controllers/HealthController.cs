using HrcTech.Infrastructure.Persistence;
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
}