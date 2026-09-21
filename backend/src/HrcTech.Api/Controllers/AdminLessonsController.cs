using HrcTech.Api.Extensions;
using HrcTech.Application.DTOs.Lessons;
using HrcTech.Application.Exceptions;
using HrcTech.Application.Interfaces;
using HrcTech.Application.Uploads;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HrcTech.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = PolicyNames.AdminOnly)]
public class AdminLessonsController(IAdminLessonService lessons) : ControllerBase
{
    [HttpGet("courses/{courseId:guid}/lessons")]
    public async Task<IActionResult> List(Guid courseId, CancellationToken ct) =>
        Ok(await lessons.ListAsync(courseId, ct));

    [HttpPost("courses/{courseId:guid}/lessons")]
    public async Task<IActionResult> Create(Guid courseId, LessonUpsertRequest request, CancellationToken ct) =>
        StatusCode(StatusCodes.Status201Created, await lessons.CreateAsync(courseId, request, ct));

    [HttpPut("courses/{courseId:guid}/lessons/order")]
    public async Task<IActionResult> Reorder(Guid courseId, LessonOrderRequest request, CancellationToken ct) =>
        Ok(await lessons.ReorderAsync(courseId, request, ct));

    [HttpPut("lessons/{id:guid}")]
    public async Task<IActionResult> Update(Guid id, LessonUpsertRequest request, CancellationToken ct) =>
        Ok(await lessons.UpdateAsync(id, request, ct));

    [HttpDelete("lessons/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await lessons.DeleteAsync(id, ct);
        return NoContent();
    }

    // Returns 202: the file is accepted, then processed in the background. Poll /status.
    [HttpPost("lessons/{id:guid}/upload")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(UploadLimits.MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = UploadLimits.MaxRequestBytes)]
    public async Task<IActionResult> Upload(Guid id, IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            throw new BadRequestException("Choose a file to upload.");

        await using var stream = file.OpenReadStream();
        var uploaded = new UploadedFile(stream, file.FileName, file.ContentType, file.Length);

        return Accepted(await lessons.UploadAsync(id, uploaded, ct));
    }

    [HttpPost("lessons/{id:guid}/retry-processing")]
    public async Task<IActionResult> Retry(Guid id, CancellationToken ct) =>
        Accepted(await lessons.RetryProcessingAsync(id, ct));

    [HttpGet("lessons/{id:guid}/status")]
    public async Task<IActionResult> Status(Guid id, CancellationToken ct) =>
        Ok(await lessons.GetStatusAsync(id, ct));

    // Admin-only preview of the watermarked file, so you can check the result. Supports Range requests.
    [HttpGet("lessons/{id:guid}/preview")]
    public async Task<IActionResult> Preview(Guid id, CancellationToken ct)
    {
        var file = await lessons.GetPreviewAsync(id, ct);
        Response.Headers.CacheControl = "no-store";
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        return PhysicalFile(file.PhysicalPath, file.ContentType, enableRangeProcessing: true);
    }
}