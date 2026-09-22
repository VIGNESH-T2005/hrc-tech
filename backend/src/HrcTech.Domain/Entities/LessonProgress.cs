namespace HrcTech.Domain.Entities;

public class LessonProgress
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid LessonId { get; set; }
    public Guid CourseId { get; set; }
    public int ProgressPercentage { get; set; }        // 0 to 100
    public int? LastPositionSeconds { get; set; }       // video only, used to resume playback
    public bool IsCompleted { get; set; }
    public DateTime LastAccessedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}