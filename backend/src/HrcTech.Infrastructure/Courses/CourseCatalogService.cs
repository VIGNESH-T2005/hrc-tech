using HrcTech.Application.DTOs;
using HrcTech.Application.DTOs.Courses;
using HrcTech.Application.Exceptions;
using HrcTech.Application.Interfaces;
using HrcTech.Domain.Constants;
using HrcTech.Domain.Enums;
using HrcTech.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HrcTech.Infrastructure.Courses;

public sealed class CourseCatalogService(AppDbContext db, IFileStorage storage) : ICourseCatalogService
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
                // Students only ever see lessons that finished processing.
                LessonCount = c.Lessons.Count(l => l.ProcessingStatus == ProcessingStatus.Ready)
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
                Lessons = c.Lessons
                    .Where(l => l.ProcessingStatus == ProcessingStatus.Ready)
                    .OrderBy(l => l.LessonOrder)
                    .Select(l => new { l.Id, l.Title, l.Description, l.ContentType, l.DurationSeconds })
                    .ToList()
            })
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("Course not found.");

        // Sequential numbering for display, and always locked for the public.
        var lessons = course.Lessons
            .Select((l, i) => new LessonSummaryDto(l.Id, l.Title, l.Description, i + 1, l.ContentType.ToString(), l.DurationSeconds, true))
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

    public async Task<ThumbnailFile> GetThumbnailAsync(Guid id, bool includeUnpublished, CancellationToken ct)
    {
        var thumbnailRef = await db.Courses.AsNoTracking()
            .Where(c => c.Id == id && (c.IsPublished || includeUnpublished))
            .Select(c => c.ThumbnailRef)
            .FirstOrDefaultAsync(ct);

        if (thumbnailRef is null || !storage.Exists(thumbnailRef))
            throw new NotFoundException("Thumbnail not found.");

        var path = storage.GetPhysicalPath(thumbnailRef);
        var contentType = Path.GetExtension(path).Equals(".png", StringComparison.OrdinalIgnoreCase) ? "image/png" : "image/jpeg";

        return new ThumbnailFile(path, contentType, Path.GetFileNameWithoutExtension(path), File.GetLastWriteTimeUtc(path));
    }
}