namespace HrcTech.Application.DTOs.Courses;

public sealed record CourseSummaryDto(
    Guid Id, string Title, string Description, string Category,
    decimal Price, string Currency, string? ThumbnailUrl, int LessonCount);

// No file reference or URL of any kind. Lessons are locked for the public.
public sealed record LessonSummaryDto(
    Guid Id, string Title, string? Description, int Order,
    string ContentType, int? DurationSeconds, bool IsLocked);

public sealed record CourseDetailDto(
    Guid Id, string Title, string Description, string Category,
    decimal Price, string Currency, string? ThumbnailUrl, int LessonCount,
    DateTime UpdatedAt, IReadOnlyList<LessonSummaryDto> Lessons);

public sealed record AdminCourseDto(
    Guid Id, string Title, string Description, string Category,
    decimal Price, string Currency, string? ThumbnailUrl, bool IsPublished,
    int LessonCount, DateTime CreatedAt, DateTime UpdatedAt);

public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount);