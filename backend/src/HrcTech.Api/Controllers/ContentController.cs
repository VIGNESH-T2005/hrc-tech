using HrcTech.Api.Extensions;
using HrcTech.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace HrcTech.Api.Controllers;

[ApiController]
[Route("api/content")]
public class ContentController(IContentAccessService content) : ControllerBase
{
    // The normal, logged-in call: gets a short-lived token to build a stream URL from.
    [HttpPost("{lessonId:guid}/access")]
    [Authorize(Policy = PolicyNames.StudentOnly)]
    public async Task<IActionResult> RequestAccess(Guid lessonId, CancellationToken ct) =>
        Ok(await content.RequestAccessAsync(User.GetUserId(), lessonId, ct));

    // No login header here on purpose: a <video> or <iframe> src can't attach one.
    // The query-string token, which is short-lived and single-lesson, is the credential instead.
    [HttpGet("{lessonId:guid}/stream")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.ContentStream)]
    public async Task<IActionResult> Stream(Guid lessonId, [FromQuery] string t, CancellationToken ct)
    {
        var file = await content.GetStreamAsync(lessonId, t, ct);

        Response.Headers.CacheControl = "no-store";
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        Response.Headers["X-Frame-Options"] = "SAMEORIGIN";

        return PhysicalFile(file.PhysicalPath, file.ContentType, enableRangeProcessing: true);
    }
}