namespace HrcTech.Application.DTOs.Lessons;

// Admin view. Deliberately has no file path or storage reference.
public sealed record AdminLessonDto(
    Guid Id, Guid CourseId, string Title, string? Description, int Order, string ContentType,
    int? DurationSeconds, int? PageCount, string ProcessingStatus, string? ProcessingStage,
    string? ProcessingError, string? OriginalFileName, long? ProcessedSizeBytes, bool IsReady,
    DateTime CreatedAt, DateTime UpdatedAt);

public sealed record LessonStatusDto(
    Guid Id, string Status, string? Stage, string? Error,
    int? DurationSeconds, int? PageCount, DateTime UpdatedAt);