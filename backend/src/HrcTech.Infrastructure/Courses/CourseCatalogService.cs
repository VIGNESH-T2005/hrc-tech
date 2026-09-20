using HrcTech.Application.DTOs.Courses;
using HrcTech.Application.Exceptions;
using HrcTech.Application.Interfaces;
using HrcTech.Domain.Constants;
using HrcTech.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HrcTech.Infrastructure.Courses;

public sealed class CourseCatalogService(AppDbContext db) : ICourseCatalogService
{
    public async Task<PagedResult<CourseSummaryDto>> GetPublishedAsync(CourseQuery query, CancellationToken ct)
    {
        // Only published courses are ever queried here. Drafts cannot leak through this service.
        var courses = db.Courses.AsNoTracking().Where(c => c.IsPublished);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            courses = courses.Where(c => c.Title.ToLower().Contains(term) || c.Description.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(query.Category))
        {
            var category = query.Category.Trim().ToLower();
            courses = courses.Where(c => c.Category.ToLower() == category);
        }

        var total = await courses.CountAsync(ct);

        var rows = await courses
            .OrderByDescending(c => c.CreatedAt).ThenBy(c => c.Id)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(c => new
            {
                c.Id, c.Title, c.Description, c.Category, c.Price,
                HasThumbnail = c.ThumbnailRef != null,
                LessonCount = c.Lessons.Count
            })
            .ToListAsync(ct);

        var items = rows.Select(r => new CourseSummaryDto(
            r.Id, r.Title, r.Description, r.Category, r.Price, Commerce.DefaultCurrency,
            CourseMapping.ThumbnailUrl(r.Id, r.HasThumbnail), r.LessonCount)).ToList();

        return new PagedResult<CourseSummaryDto>(items, query.Page, query.PageSize, total);
    }

    public async Task<CourseDetailDto> GetPublishedByIdAsync(Guid id, CancellationToken ct)
    {
        // A draft and a missing course look the same to the public: 404.
        var course = await db.Courses.AsNoTracking()
            .Where(c => c.Id == id && c.IsPublished)
            .Select(c => new
            {
                c.Id, c.Title, c.Description, c.Category, c.Price, c.UpdatedAt,
                HasThumbnail = c.ThumbnailRef != null,
                Lessons = c.Lessons.OrderBy(l => l.LessonOrder)
                    .Select(l => new { l.Id, l.Title, l.Description, l.LessonOrder, l.ContentType, l.DurationSeconds })
                    .ToList()
            })
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("Course not found.");

        var lessons = course.Lessons
            .Select(l => new LessonSummaryDto(l.Id, l.Title, l.Description, l.LessonOrder, l.ContentType.ToString(), l.DurationSeconds, true))
            .ToList();

        return new CourseDetailDto(
            course.Id, course.Title, course.Description, course.Category, course.Price, Commerce.DefaultCurrency,
            CourseMapping.ThumbnailUrl(course.Id, course.HasThumbnail), lessons.Count, course.UpdatedAt, lessons);
    }

    public async Task<IReadOnlyList<string>> GetCategoriesAsync(CancellationToken ct)
    {
        var names = await db.Courses.AsNoTracking()
            .Where(c => c.IsPublished)
            .Select(c => c.Category)
            .Distinct()
            .ToListAsync(ct);

        return names.OrderBy(n => n, StringComparer.OrdinalIgnoreCase).ToList();
    }
}