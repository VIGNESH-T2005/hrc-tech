using HrcTech.Application.DTOs.Enrollments;
using HrcTech.Api.Extensions;
using HrcTech.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HrcTech.Api.Controllers;

// A manual grant tool for the teacher (scholarships, testing, goodwill access).
// This exists alongside, not instead of, the payment-driven enrollment path added in Phase 7.
[ApiController]
[Route("api/admin/enrollments")]
[Authorize(Policy = PolicyNames.AdminOnly)]
public class AdminEnrollmentsController(IEnrollmentService enrollments) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Grant(GrantEnrollmentRequest request, CancellationToken ct) =>
        StatusCode(StatusCodes.Status201Created, await enrollments.GrantAsync(request, ct));
}