using HrcTech.Application.DTOs.Quizzes;
using HrcTech.Application.Exceptions;
using HrcTech.Application.Interfaces;
using HrcTech.Domain.Entities;
using HrcTech.Domain.Enums;
using HrcTech.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HrcTech.Infrastructure.Quizzes;

public sealed class StudentQuizService(AppDbContext db, IEnrollmentService enrollments) : IStudentQuizService
{
    public async Task<StudentQuizDto> GetAsync(Guid studentId, Guid courseId, CancellationToken ct)
    {
        await EnsureUnlockedAsync(studentId, courseId, ct);

        var quiz = await LoadAsync(courseId, ct)
            ?? throw new NotFoundException("This course does not have a quiz.");

        return new StudentQuizDto(quiz.Id, quiz.Title, quiz.PassingScore,
            quiz.Questions.OrderBy(q => q.QuestionOrder).Select(q => new StudentQuizQuestionDto(
                q.Id, q.QuestionText,
                // Shuffle so repeated attempts don't always show the correct option in the same position.
                q.Options.OrderBy(_ => Guid.NewGuid()).Select(o => new StudentQuizOptionDto(o.Id, o.OptionText)).ToList()
            )).ToList());
    }

    public async Task<QuizResultDto> SubmitAsync(Guid studentId, Guid courseId, QuizSubmitRequest request, CancellationToken ct)
    {
        // Re-check everything. A client could call submit without ever calling GET.
        await EnsureUnlockedAsync(studentId, courseId, ct);

        var quiz = await LoadAsync(courseId, ct)
            ?? throw new NotFoundException("This course does not have a quiz.");

        var questionIds = quiz.Questions.Select(q => q.Id).ToHashSet();
        var answeredIds = request.Answers.Select(a => a.QuestionId).ToList();

        if (answeredIds.Count != questionIds.Count || answeredIds.Distinct().Count() != questionIds.Count || !answeredIds.All(questionIds.Contains))
            throw new BadRequestException("Answer every question exactly once.");

        // Correct answers are loaded fresh from the database here — never from anything the client sent.
        var correctCount = 0;
        foreach (var answer in request.Answers)
        {
            var question = quiz.Questions.First(q => q.Id == answer.QuestionId);
            var option = question.Options.FirstOrDefault(o => o.Id == answer.OptionId)
                ?? throw new BadRequestException("One of the submitted options does not belong to its question.");

            if (option.IsCorrect) correctCount++;
        }

        var total = quiz.Questions.Count;
        var score = (int)Math.Round(correctCount * 100.0 / total);
        var passed = score >= quiz.PassingScore;
        var now = DateTime.UtcNow;

        db.QuizAttempts.Add(new QuizAttempt
        {
            Id = Guid.NewGuid(),
            QuizId = quiz.Id,
            StudentId = studentId,
            TotalQuestions = total,
            CorrectCount = correctCount,
            Score = score,
            Passed = passed,
            AttemptedAt = now
        });

        await db.SaveChangesAsync(ct);

        return new QuizResultDto(score, quiz.PassingScore, passed, correctCount, total, now);
    }

    private async Task EnsureUnlockedAsync(Guid studentId, Guid courseId, CancellationToken ct)
    {
        if (!await enrollments.IsActivelyEnrolledAsync(studentId, courseId, ct))
            throw new ForbiddenException("You are not enrolled in this course.");

        var totalReady = await db.Lessons.CountAsync(l => l.CourseId == courseId && l.ProcessingStatus == ProcessingStatus.Ready, ct);
        if (totalReady == 0)
            throw new ForbiddenException("This course has no lessons yet.");

        var completed = await db.LessonProgress.CountAsync(p => p.StudentId == studentId && p.CourseId == courseId && p.IsCompleted, ct);
        if (completed < totalReady)
            throw new ForbiddenException("Complete all lessons before taking the quiz.");
    }

    private Task<Quiz?> LoadAsync(Guid courseId, CancellationToken ct) =>
        db.Quizzes.Include(q => q.Questions).ThenInclude(qq => qq.Options)
            .FirstOrDefaultAsync(q => q.CourseId == courseId, ct);
}