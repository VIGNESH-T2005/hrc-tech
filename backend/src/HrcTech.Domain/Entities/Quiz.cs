namespace HrcTech.Domain.Entities;

public class Quiz
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }           // unique — one quiz per course
    public string Title { get; set; } = string.Empty;
    public int PassingScore { get; set; }        // percentage, 1 to 100
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<QuizQuestion> Questions { get; set; } = [];
}