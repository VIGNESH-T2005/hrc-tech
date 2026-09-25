using HrcTech.Application.DTOs.Progress;
using HrcTech.Application.Exceptions;
using HrcTech.Application.Interfaces;
using HrcTech.Application.Settings;
using HrcTech.Domain.Entities;
using HrcTech.Domain.Enums;
using HrcTech.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace HrcTech.Infrastructure.Content;

public sealed class ProgressService(AppDbContext db, IEnrollmentService enrollments, IOptions<ContentAccessOptions> options)
    : IProgressService
{
    private readonly ContentAccessOptions _o = options.Value;

    public async Task<LessonProgressDto> UpdateAsync(Guid studentId, Guid lessonId, ProgressUpdateRequest request, CancellationToken ct)
    {
        var lesson = await db.Lessons.AsNoTracking().FirstOrDefaultAsync(l => l.Id == lessonId, ct)
            ?? throw new NotFoundException("Lesson not found.");

        if (lesson.ProcessingStatus != ProcessingStatus.Ready)
            throw new ForbiddenException("This lesson is not available yet.");

        if (!await enrollments.IsActivelyEnrolledAsync(studentId, lesson.CourseId, ct))
            throw new ForbiddenException("You are not enrolled in this course.");

        var (percentage, position, completedNow) = lesson.ContentType == LessonContentType.Video
            ? ComputeVideo(lesson, request)
            : ComputePdf(lesson, request);

        var progress = await db.LessonProgress.FirstOrDefaultAsync(p => p.StudentId == studentId && p.LessonId == lessonId, ct);
        var now = DateTime.UtcNow;

        if (progress is null)
        {
            progress = new LessonProgress
            {
                Id = Guid.NewGuid(),
                StudentId = studentId,
                LessonId = lessonId,
                CourseId = lesson.CourseId,
                LastAccessedAt = now
            };
            db.LessonProgress.Add(progress);
        }

        // Progress and completion never move backwards: seeking to an earlier point in a video
        // doesn't erase credit already earned, and a completed lesson stays completed.
        progress.ProgressPercentage = Math.Max(progress.ProgressPercentage, percentage);
        if (position.HasValue) progress.LastPositionSeconds = position;
        progress.LastAccessedAt = now;

        if ((completedNow || progress.IsCompleted) && !progress.IsCompleted)
        {
            progress.IsCompleted = true;
            progress.CompletedAt = now;
        }

        await db.SaveChangesAsync(ct);

        return new LessonProgressDto(lessonId, lesson.Title, lesson.LessonOrder, lesson.ContentType.ToString(),
            progress.ProgressPercentage, progress.LastPositionSeconds, progress.IsCompleted);
    }

    public async Task<CourseProgressDto> GetCourseProgressAsync(Guid studentId, Guid courseId, CancellationToken ct)
    {
        if (!await enrollments.IsActivelyEnrolledAsync(studentId, courseId, ct))
            throw new ForbiddenException("You are not enrolled in this course.");

        var lessons = await db.Lessons.AsNoTracking()
            .Where(l => l.CourseId == courseId && l.ProcessingStatus == ProcessingStatus.Ready)
            .OrderBy(l => l.LessonOrder)
            .Select(l => new { l.Id, l.Title, l.LessonOrder, l.ContentType })
            .ToListAsync(ct);

        var progressById = await db.LessonProgress.AsNoTracking()
            .Where(p => p.StudentId == studentId && p.CourseId == courseId)
            .ToDictionaryAsync(p => p.LessonId, ct);

        var items = lessons.Select(l =>
        {
            progressById.TryGetValue(l.Id, out var p);
            return new LessonProgressDto(l.Id, l.Title, l.LessonOrder, l.ContentType.ToString(),
                p?.ProgressPercentage ?? 0, p?.LastPositionSeconds, p?.IsCompleted ?? false);
        }).ToList();

        var completed = items.Count(i => i.IsCompleted);
        var overall = items.Count == 0 ? 0 : (int)Math.Round(items.Average(i => i.ProgressPercentage));
        var allLessonsCompleted = items.Count > 0 && completed == items.Count;
        var (hasQuiz, quizUnlocked, quizPassed) = await GetQuizStateAsync(studentId, courseId, allLessonsCompleted, ct);
        var courseCompleted = allLessonsCompleted && (!hasQuiz || quizPassed);

        return new CourseProgressDto(courseId, items.Count, completed, overall, allLessonsCompleted, items, hasQuiz, quizUnlocked, quizPassed, courseCompleted);
    }

    private async Task<(bool HasQuiz, bool Unlocked, bool Passed)> GetQuizStateAsync(Guid studentId, Guid courseId, bool allLessonsCompleted, CancellationToken ct)
    {
        var quizId = await db.Quizzes.AsNoTracking().Where(q => q.CourseId == courseId).Select(q => (Guid?)q.Id).FirstOrDefaultAsync(ct);
        if (quizId is null) return (false, false, false);

        var passed = await db.QuizAttempts.AsNoTracking()
            .Where(a => a.QuizId == quizId && a.StudentId == studentId)
            .OrderByDescending(a => a.AttemptedAt)
            .Select(a => (bool?)a.Passed)
            .FirstOrDefaultAsync(ct) ?? false;

        return (true, allLessonsCompleted, passed);
    }
    
    private (int Percentage, int? Position, bool Completed) ComputeVideo(Lesson lesson, ProgressUpdateRequest request)
    {
        if (request.PositionSeconds is null) throw new BadRequestException("positionSeconds is required for a video lesson.");

        var duration = lesson.DurationSeconds ?? 0;
        var position = Math.Clamp(request.PositionSeconds.Value, 0, Math.Max(duration, request.PositionSeconds.Value));
        var percentage = duration <= 0 ? 0 : (int)Math.Min(100, Math.Round(position * 100.0 / duration));

        return (percentage, position, percentage >= _o.VideoCompletionThresholdPercent);
    }

    private static (int Percentage, int? Position, bool Completed) ComputePdf(Lesson lesson, ProgressUpdateRequest request)
    {
        if (request.PdfPageReached is null) throw new BadRequestException("pdfPageReached is required for a PDF lesson.");

        var pages = lesson.PageCount ?? 0;
        var reached = Math.Clamp(request.PdfPageReached.Value, 1, Math.Max(pages, request.PdfPageReached.Value));
        var percentage = pages <= 0 ? 0 : (int)Math.Min(100, Math.Round(reached * 100.0 / pages));

        return (percentage, null, pages > 0 && reached >= pages);
    }
}