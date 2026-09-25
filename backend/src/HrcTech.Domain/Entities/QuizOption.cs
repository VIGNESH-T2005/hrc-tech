namespace HrcTech.Domain.Entities;

public class QuizOption
{
    public Guid Id { get; set; }
    public Guid QuestionId { get; set; }
    public string OptionText { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int OptionOrder { get; set; }
}