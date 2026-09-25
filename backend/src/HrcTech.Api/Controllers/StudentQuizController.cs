using HrcTech.Api.Extensions;
using HrcTech.Application.DTOs.Quizzes;
using HrcTech.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HrcTech.Api.Controllers;

[ApiController]
[Route("api/student/courses/{courseId:guid}/quiz")]
[Authorize(Policy = PolicyNames.StudentOnly)]
public class StudentQuizController(IStudentQuizService quiz) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(Guid courseId, CancellationToken ct) =>
        Ok(await quiz.GetAsync(User.GetUserId(), courseId, ct));

    [HttpPost("submit")]
    public async Task<IActionResult> Submit(Guid courseId, QuizSubmitRequest request, CancellationToken ct) =>
        Ok(await quiz.SubmitAsync(User.GetUserId(), courseId, request, ct));
}