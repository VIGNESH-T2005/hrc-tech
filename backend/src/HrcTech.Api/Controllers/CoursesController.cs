using HrcTech.Application.DTOs.Courses;
using HrcTech.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

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
}