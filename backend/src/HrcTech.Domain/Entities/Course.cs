namespace HrcTech.Domain.Entities;

public class Course
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Price { get; set; }                 // in INR
    public string? ThumbnailRef { get; set; }          // internal storage reference (set in Phase 5), never exposed
    public bool IsPublished { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid CreatedByAdminId { get; set; }
    public List<Lesson> Lessons { get; set; } = [];
}