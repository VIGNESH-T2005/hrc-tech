using System.ComponentModel.DataAnnotations;

namespace HrcTech.Application.DTOs.Progress;

public sealed class ProgressUpdateRequest
{
    // Video lessons report how far the student has watched.
    [Range(0, int.MaxValue)]
    public int? PositionSeconds { get; init; }

    // PDF lessons report the highest page number reached (1-based).
    [Range(1, int.MaxValue)]
    public int? PdfPageReached { get; init; }
}

public sealed record LessonProgressDto(
    Guid LessonId, string Title, int Order, string ContentType,
    int ProgressPercentage, int? LastPositionSeconds, bool IsCompleted);

public sealed record CourseProgressDto(
    Guid CourseId, int TotalLessons, int CompletedLessons,
    int OverallPercentage, bool AllLessonsCompleted,
    IReadOnlyList<LessonProgressDto> Lessons,
    bool HasQuiz, bool QuizUnlocked, bool QuizPassed, bool CourseCompleted);