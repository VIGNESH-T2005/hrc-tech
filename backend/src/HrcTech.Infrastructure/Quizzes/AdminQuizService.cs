using HrcTech.Application.DTOs.Quizzes;
using HrcTech.Application.Exceptions;
using HrcTech.Application.Interfaces;
using HrcTech.Domain.Entities;
using HrcTech.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HrcTech.Infrastructure.Quizzes;

public sealed class AdminQuizService(AppDbContext db) : IAdminQuizService
{
    public async Task<AdminQuizDto?> GetAsync(Guid courseId, CancellationToken ct)
    {
        await EnsureCourseExistsAsync(courseId, ct);

        var quiz = await LoadAsync(courseId, ct);
        return quiz is null ? null : ToDto(quiz);
    }

    public async Task<AdminQuizDto> UpsertAsync(Guid courseId, QuizUpsertRequest request, CancellationToken ct)
    {
        await EnsureCourseExistsAsync(courseId, ct);
        ValidateShape(request);

        var quiz = await LoadAsync(courseId, ct);
        var now = DateTime.UtcNow;

        if (quiz is null)
        {
            quiz = new Quiz { Id = Guid.NewGuid(), CourseId = courseId, CreatedAt = now };
            db.Quizzes.Add(quiz);
        }
        else
        {
            // Replace the whole question/option tree. Simple and safe for a single-admin tool —
            // no partial-edit conflicts to worry about, and old QuizAttempts are untouched
            // because they only store the score, not a link to specific questions/options.
            db.QuizOptions.RemoveRange(quiz.Questions.SelectMany(q => q.Options));
            db.QuizQuestions.RemoveRange(quiz.Questions);
        }

        quiz.Title = request.Title.Trim();
        quiz.PassingScore = request.PassingScore;
        quiz.UpdatedAt = now;
        quiz.Questions = request.Questions.Select((q, qi) => new QuizQuestion
        {
            Id = Guid.NewGuid(),
            QuizId = quiz.Id,
            QuestionText = q.QuestionText.Trim(),
            QuestionOrder = qi + 1,
            CreatedAt = now,
            Options = q.Options.Select((o, oi) => new QuizOption
            {
                Id = Guid.NewGuid(),
                OptionText = o.OptionText.Trim(),
                IsCorrect = o.IsCorrect,
                OptionOrder = oi + 1
            }).ToList()
        }).ToList();

        await db.SaveChangesAsync(ct);
        return ToDto(quiz);
    }

    public async Task DeleteAsync(Guid courseId, CancellationToken ct)
    {
        var quiz = await db.Quizzes.FirstOrDefaultAsync(q => q.CourseId == courseId, ct)
            ?? throw new NotFoundException("This course has no quiz.");

        db.Quizzes.Remove(quiz);   // cascades to questions, options and attempts
        await db.SaveChangesAsync(ct);
    }

    private static void ValidateShape(QuizUpsertRequest request)
    {
        foreach (var q in request.Questions)
        {
            if (q.Options.Count(o => o.IsCorrect) != 1)
                throw new BadRequestException($"The question \"{Trim(q.QuestionText)}\" must have exactly one correct option.");

            if (q.Options.Select(o => o.OptionText.Trim().ToLower()).Distinct().Count() != q.Options.Count)
                throw new BadRequestException($"The question \"{Trim(q.QuestionText)}\" has duplicate options.");
        }
    }

    private static string Trim(string s) => s.Length > 60 ? s[..60] + "…" : s;

    private Task<Quiz?> LoadAsync(Guid courseId, CancellationToken ct) =>
        db.Quizzes.Include(q => q.Questions).ThenInclude(qq => qq.Options)
            .FirstOrDefaultAsync(q => q.CourseId == courseId, ct);

    private async Task EnsureCourseExistsAsync(Guid courseId, CancellationToken ct)
    {
        if (!await db.Courses.AnyAsync(c => c.Id == courseId, ct))
            throw new NotFoundException("Course not found.");
    }

    private static AdminQuizDto ToDto(Quiz q) => new(
        q.Id, q.CourseId, q.Title, q.PassingScore,
        q.Questions.OrderBy(x => x.QuestionOrder).Select(x => new AdminQuizQuestionDto(
            x.Id, x.QuestionText, x.QuestionOrder,
            x.Options.OrderBy(o => o.OptionOrder).Select(o => new AdminQuizOptionDto(o.Id, o.OptionText, o.IsCorrect, o.OptionOrder)).ToList()
        )).ToList(),
        q.UpdatedAt);
}