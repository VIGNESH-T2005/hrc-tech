using System.Linq.Expressions;
using HrcTech.Application.DTOs.Courses;
using HrcTech.Application.Exceptions;
using HrcTech.Application.Interfaces;
using HrcTech.Domain.Constants;
using HrcTech.Domain.Entities;
using HrcTech.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HrcTech.Infrastructure.Courses;

public sealed class AdminCourseService(AppDbContext db) : IAdminCourseService
{
    private sealed record Row(
        Guid Id, string Title, string Description, string Category, decimal Price,
        bool HasThumbnail, bool IsPublished, int LessonCount, DateTime CreatedAt, DateTime UpdatedAt);

    private static readonly Expression<Func<Course, Row>> ToRow = c => new Row(
        c.Id, c.Title, c.Description, c.Category, c.Price,
        c.ThumbnailRef != null, c.IsPublished, c.Lessons.Count, c.CreatedAt, c.UpdatedAt);

    public async Task<IReadOnlyList<AdminCourseDto>> ListAsync(CancellationToken ct)
    {
        var rows = await db.Courses.AsNoTracking()
            .OrderByDescending(c => c.UpdatedAt)
            .Select(ToRow)
            .ToListAsync(ct);

        return rows.Select(ToDto).ToList();
    }

    public async Task<AdminCourseDto> GetAsync(Guid id, CancellationToken ct)
    {
        var row = await db.Courses.AsNoTracking()
            .Where(c => c.Id == id)
            .Select(ToRow)
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("Course not found.");

        return ToDto(row);
    }

    public async Task<AdminCourseDto> CreateAsync(Guid adminId, CourseUpsertRequest request, CancellationToken ct)
    {
        var f = await NormalizeAsync(request, null, ct);
        var now = DateTime.UtcNow;

        var course = new Course
        {
            Id = Guid.NewGuid(),
            Title = f.Title,
            Description = f.Description,
            Category = f.Category,
            Price = f.Price,
            IsPublished = false,          // every new course starts as a draft
            CreatedAt = now,
            UpdatedAt = now,
            CreatedByAdminId = adminId
        };

        db.Courses.Add(course);
        await db.SaveChangesAsync(ct);

        return ToDto(course, 0);
    }

    public async Task<AdminCourseDto> UpdateAsync(Guid id, CourseUpsertRequest request, CancellationToken ct)
    {
        var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new NotFoundException("Course not found.");

        var f = await NormalizeAsync(request, id, ct);

        course.Title = f.Title;
        course.Description = f.Description;
        course.Category = f.Category;
        course.Price = f.Price;
        course.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        var lessonCount = await db.Lessons.CountAsync(l => l.CourseId == id, ct);
        return ToDto(course, lessonCount);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new NotFoundException("Course not found.");

        if (course.IsPublished)
            throw new ConflictException("Unpublish this course before deleting it.");

        // Lessons are removed by the database (cascade).
        db.Courses.Remove(course);
        await db.SaveChangesAsync(ct);
    }

    public async Task<AdminCourseDto> SetPublishedAsync(Guid id, bool published, CancellationToken ct)
    {
        var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new NotFoundException("Course not found.");

        // Idempotent: repeating the same action changes nothing.
        if (course.IsPublished != published)
        {
            course.IsPublished = published;
            course.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
        }

        var lessonCount = await db.Lessons.CountAsync(l => l.CourseId == id, ct);
        return ToDto(course, lessonCount);
    }

    private async Task<(string Title, string Description, string Category, decimal Price)> NormalizeAsync(
        CourseUpsertRequest request, Guid? excludeCourseId, CancellationToken ct)
    {
        var title = request.Title.Trim();
        var description = request.Description.Trim();
        var category = string.Join(' ', request.Category.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));

        if (title.Length < 3) throw new BadRequestException("Title must be at least 3 characters.");
        if (description.Length < 10) throw new BadRequestException("Description must be at least 10 characters.");
        if (category.Length < 2) throw new BadRequestException("Category must be at least 2 characters.");
        if (decimal.Round(request.Price, 2) != request.Price)
            throw new BadRequestException("Price can have at most 2 decimal places.");

        // Reuse the spelling of an existing category so "web" and "Web" don't become two filters.
        var lower = category.ToLower();
        var existing = await db.Courses
            .Where(c => (excludeCourseId == null || c.Id != excludeCourseId) && c.Category.ToLower() == lower)
            .Select(c => c.Category)
            .FirstOrDefaultAsync(ct);

        return (title, description, existing ?? category, request.Price);
    }

    private static AdminCourseDto ToDto(Row r) => new(
        r.Id, r.Title, r.Description, r.Category, r.Price, Commerce.DefaultCurrency,
        CourseMapping.ThumbnailUrl(r.Id, r.HasThumbnail), r.IsPublished, r.LessonCount, r.CreatedAt, r.UpdatedAt);

    private static AdminCourseDto ToDto(Course c, int lessonCount) => new(
        c.Id, c.Title, c.Description, c.Category, c.Price, Commerce.DefaultCurrency,
        CourseMapping.ThumbnailUrl(c.Id, c.ThumbnailRef != null), c.IsPublished, lessonCount, c.CreatedAt, c.UpdatedAt);
}