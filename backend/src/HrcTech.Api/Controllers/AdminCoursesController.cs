using HrcTech.Api.Extensions;
using HrcTech.Application.DTOs.Courses;
using HrcTech.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HrcTech.Api.Controllers;

// Every action requires the single Admin account. Students get 403, anonymous callers get 401.
[ApiController]
[Route("api/admin/courses")]
[Authorize(Policy = PolicyNames.AdminOnly)]
public class AdminCoursesController(IAdminCourseService courses) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) =>
        Ok(await courses.ListAsync(ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct) =>
        Ok(await courses.GetAsync(id, ct));

    [HttpPost]
    public async Task<IActionResult> Create(CourseUpsertRequest request, CancellationToken ct)
    {
        var course = await courses.CreateAsync(User.GetUserId(), request, ct);
        return CreatedAtAction(nameof(GetById), new { id = course.Id }, course);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, CourseUpsertRequest request, CancellationToken ct) =>
        Ok(await courses.UpdateAsync(id, request, ct));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await courses.DeleteAsync(id, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/publish")]
    public async Task<IActionResult> Publish(Guid id, CancellationToken ct) =>
        Ok(await courses.SetPublishedAsync(id, true, ct));

    [HttpPost("{id:guid}/unpublish")]
    public async Task<IActionResult> Unpublish(Guid id, CancellationToken ct) =>
        Ok(await courses.SetPublishedAsync(id, false, ct));
}