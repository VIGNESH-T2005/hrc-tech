namespace HrcTech.Domain.Entities;

public class QuizQuestion
{
    public Guid Id { get; set; }
    public Guid QuizId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public int QuestionOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<QuizOption> Options { get; set; } = [];
}