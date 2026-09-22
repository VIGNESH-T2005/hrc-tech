using HrcTech.Api.Extensions;
using HrcTech.Application.DTOs.Progress;
using HrcTech.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HrcTech.Api.Controllers;

[ApiController]
[Route("api/student")]
[Authorize(Policy = PolicyNames.StudentOnly)]
public class StudentProgressController(IProgressService progress, IEnrollmentService enrollments) : ControllerBase
{
    [HttpPost("lessons/{lessonId:guid}/progress")]
    public async Task<IActionResult> UpdateProgress(Guid lessonId, ProgressUpdateRequest request, CancellationToken ct) =>
        Ok(await progress.UpdateAsync(User.GetUserId(), lessonId, request, ct));

    [HttpGet("courses/{courseId:guid}/progress")]
    public async Task<IActionResult> GetCourseProgress(Guid courseId, CancellationToken ct) =>
        Ok(await progress.GetCourseProgressAsync(User.GetUserId(), courseId, ct));

    // Preview of "My courses" for the dashboard. Full purchase history and detail pages arrive in Phase 7.
    [HttpGet("courses")]
    public async Task<IActionResult> MyCourses(CancellationToken ct) =>
        Ok(await enrollments.GetMyCoursesAsync(User.GetUserId(), ct));
}