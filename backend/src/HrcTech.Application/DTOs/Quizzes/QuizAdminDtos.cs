using System.ComponentModel.DataAnnotations;

namespace HrcTech.Application.DTOs.Quizzes;

public sealed class QuizOptionUpsertRequest
{
    [Required, StringLength(500, MinimumLength = 1)]
    public string OptionText { get; init; } = string.Empty;

    public bool IsCorrect { get; init; }
}

public sealed class QuizQuestionUpsertRequest
{
    [Required, StringLength(1000, MinimumLength = 3)]
    public string QuestionText { get; init; } = string.Empty;

    [Required, MinLength(2, ErrorMessage = "Each question needs at least 2 options.")]
    public List<QuizOptionUpsertRequest> Options { get; init; } = [];
}

public sealed class QuizUpsertRequest
{
    [Required, StringLength(200, MinimumLength = 3)]
    public string Title { get; init; } = string.Empty;

    [Range(1, 100)]
    public int PassingScore { get; init; } = 70;

    [Required, MinLength(1, ErrorMessage = "The quiz needs at least 1 question.")]
    public List<QuizQuestionUpsertRequest> Questions { get; init; } = [];
}

public sealed record AdminQuizOptionDto(Guid Id, string OptionText, bool IsCorrect, int Order);
public sealed record AdminQuizQuestionDto(Guid Id, string QuestionText, int Order, IReadOnlyList<AdminQuizOptionDto> Options);
public sealed record AdminQuizDto(Guid Id, Guid CourseId, string Title, int PassingScore, IReadOnlyList<AdminQuizQuestionDto> Questions, DateTime UpdatedAt);