using HrcTech.Domain.Enums;

namespace HrcTech.Domain.Entities;

public class Lesson
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public Course Course { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int LessonOrder { get; set; }
    public LessonContentType ContentType { get; set; }
    public int? DurationSeconds { get; set; }        // videos
    public int? PageCount { get; set; }              // PDFs
    public string? OriginalFileName { get; set; }    // display only, never used as a path

    // Internal storage references. These never leave the server.
    public string? RawFileRef { get; set; }
    public string? ProcessedFileRef { get; set; }

    public ProcessingStatus ProcessingStatus { get; set; } = ProcessingStatus.NoContent;
    public string? ProcessingStage { get; set; }
    public string? ProcessingError { get; set; }
    public long? ProcessedSizeBytes { get; set; }
    public DateTime? ProcessedAt { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}