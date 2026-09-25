namespace HrcTech.Domain.Entities;

public class QuizAttempt
{
    public Guid Id { get; set; }
    public Guid QuizId { get; set; }
    public Guid StudentId { get; set; }
    public int TotalQuestions { get; set; }
    public int CorrectCount { get; set; }
    public int Score { get; set; }               // percentage
    public bool Passed { get; set; }
    public DateTime AttemptedAt { get; set; }
}