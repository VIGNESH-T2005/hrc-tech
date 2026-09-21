using HrcTech.Domain.Constants;
using HrcTech.Application.DTOs.Courses;
using HrcTech.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Net.Http.Headers;

namespace HrcTech.Api.Controllers;

// Public. Only published courses are visible here.
[ApiController]
[Route("api/courses")]
public class CoursesController(ICourseCatalogService catalog) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] CourseQuery query, CancellationToken ct) =>
        Ok(await catalog.GetPublishedAsync(query, ct));

    [HttpGet("categories")]
    public async Task<IActionResult> Categories(CancellationToken ct) =>
        Ok(await catalog.GetCategoriesAsync(ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct) =>
        Ok(await catalog.GetPublishedByIdAsync(id, ct));

    // A marketing image, not course content. Drafts are only visible to the admin.
    [HttpGet("{id:guid}/thumbnail")]
    public async Task<IActionResult> Thumbnail(Guid id, CancellationToken ct)
    {
        var file = await catalog.GetThumbnailAsync(id, User.IsInRole(Roles.Admin), ct);

        Response.Headers.CacheControl = "no-cache";   // revalidate with the ETag every time
        Response.Headers["X-Content-Type-Options"] = "nosniff";

        return PhysicalFile(
            file.PhysicalPath,
            file.ContentType,
            new DateTimeOffset(file.LastModifiedUtc),
            new EntityTagHeaderValue($"\"{file.ETag}\""));
    }
}