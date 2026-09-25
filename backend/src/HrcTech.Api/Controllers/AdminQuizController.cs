using HrcTech.Api.Extensions;
using HrcTech.Application.DTOs.Quizzes;
using HrcTech.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HrcTech.Api.Controllers;

[ApiController]
[Route("api/admin/courses/{courseId:guid}/quiz")]
[Authorize(Policy = PolicyNames.AdminOnly)]
public class AdminQuizController(IAdminQuizService quiz) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(Guid courseId, CancellationToken ct)
    {
        var result = await quiz.GetAsync(courseId, ct);
        return result is null ? NotFound(new { message = "This course has no quiz yet." }) : Ok(result);
    }

    [HttpPut]
    public async Task<IActionResult> Upsert(Guid courseId, QuizUpsertRequest request, CancellationToken ct) =>
        Ok(await quiz.UpsertAsync(courseId, request, ct));

    [HttpDelete]
    public async Task<IActionResult> Delete(Guid courseId, CancellationToken ct)
    {
        await quiz.DeleteAsync(courseId, ct);
        return NoContent();
    }
}