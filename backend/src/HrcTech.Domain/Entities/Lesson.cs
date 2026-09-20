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
    public int? DurationSeconds { get; set; }
    public DateTime CreatedAt { get; set; }
    // File reference and processing status columns are added in Phase 5.
}