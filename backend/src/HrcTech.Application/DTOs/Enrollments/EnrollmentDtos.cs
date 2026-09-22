using System.ComponentModel.DataAnnotations;

namespace HrcTech.Application.DTOs.Enrollments;

public sealed class GrantEnrollmentRequest
{
    [Required, EmailAddress]
    public string StudentEmail { get; init; } = string.Empty;

    [Required]
    public Guid CourseId { get; init; }
}

public sealed record EnrollmentDto(Guid Id, Guid StudentId, string StudentEmail, Guid CourseId, string CourseTitle, string Status, DateTime EnrolledAt);

public sealed record MyCourseDto(Guid CourseId, string Title, string? ThumbnailUrl, int LessonCount, int CompletedLessons, DateTime EnrolledAt);