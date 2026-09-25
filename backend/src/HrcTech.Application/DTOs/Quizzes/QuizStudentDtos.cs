using System.ComponentModel.DataAnnotations;

namespace HrcTech.Application.DTOs.Quizzes;

// No IsCorrect anywhere in this file — these are the shapes the student actually receives.
public sealed record StudentQuizOptionDto(Guid Id, string OptionText);
public sealed record StudentQuizQuestionDto(Guid Id, string QuestionText, IReadOnlyList<StudentQuizOptionDto> Options);
public sealed record StudentQuizDto(Guid Id, string Title, int PassingScore, IReadOnlyList<StudentQuizQuestionDto> Questions);

public sealed class QuizAnswerSubmission
{
    [Required]
    public Guid QuestionId { get; init; }

    [Required]
    public Guid OptionId { get; init; }
}

public sealed class QuizSubmitRequest
{
    [Required, MinLength(1)]
    public List<QuizAnswerSubmission> Answers { get; init; } = [];
}

public sealed record QuizResultDto(int Score, int PassingScore, bool Passed, int CorrectCount, int TotalQuestions, DateTime AttemptedAt);