using System.Security.Cryptography;
using System.Text;
using HrcTech.Application.DTOs;
using HrcTech.Application.DTOs.Content;
using HrcTech.Application.Exceptions;
using HrcTech.Application.Interfaces;
using HrcTech.Application.Settings;
using HrcTech.Domain.Entities;
using HrcTech.Domain.Enums;
using HrcTech.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace HrcTech.Infrastructure.Content;

public sealed class ContentAccessService(
    AppDbContext db, IFileStorage storage, IEnrollmentService enrollments, IOptions<ContentAccessOptions> options)
    : IContentAccessService
{
    private const string NoAccess = "You do not have access to this lesson.";
    private readonly ContentAccessOptions _o = options.Value;

    public async Task<ContentAccessDto> RequestAccessAsync(Guid studentId, Guid lessonId, CancellationToken ct)
    {
        var lesson = await db.Lessons.AsNoTracking().FirstOrDefaultAsync(l => l.Id == lessonId, ct)
            ?? throw new NotFoundException("Lesson not found.");

        // Same message whether the lesson is missing, unready, or the course isn't purchased.
        // No detail here should tell an unauthorized caller which reason applies.
        if (lesson.ProcessingStatus != ProcessingStatus.Ready)
            throw new ForbiddenException(NoAccess);

        if (!await enrollments.IsActivelyEnrolledAsync(studentId, lesson.CourseId, ct))
            throw new ForbiddenException(NoAccess);

        var raw = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var now = DateTime.UtcNow;

        db.ContentAccessTokens.Add(new ContentAccessToken
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            LessonId = lessonId,
            TokenHash = Hash(raw),
            CreatedAt = now,
            ExpiresAt = now.AddMinutes(_o.TokenMinutes)
        });

        // Housekeeping: this student's old expired tokens for this lesson don't need to linger.
        await db.ContentAccessTokens
            .Where(t => t.StudentId == studentId && t.LessonId == lessonId && t.ExpiresAt < now)
            .ExecuteDeleteAsync(ct);

        await db.SaveChangesAsync(ct);

        var contentType = lesson.ContentType == LessonContentType.Video ? "video/mp4" : "application/pdf";
        var streamUrl = $"/api/content/{lessonId}/stream?t={raw}";

        return new ContentAccessDto(streamUrl, _o.TokenMinutes * 60, contentType);
    }

    public async Task<ContentFile> GetStreamAsync(Guid lessonId, string rawToken, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(rawToken))
            throw new UnauthorizedException(NoAccess);

        var hash = Hash(rawToken);
        var now = DateTime.UtcNow;

        var token = await db.ContentAccessTokens.AsNoTracking()
            .FirstOrDefaultAsync(t => t.TokenHash == hash && t.LessonId == lessonId, ct);

        if (token is null || token.ExpiresAt <= now)
            throw new UnauthorizedException(NoAccess);

        var lesson = await db.Lessons.AsNoTracking().FirstOrDefaultAsync(l => l.Id == lessonId, ct)
            ?? throw new NotFoundException("Lesson not found.");

        // Re-check entitlement on every stream request, not just at token issue time,
        // so a revoked enrollment stops access immediately rather than waiting for the token to expire.
        if (lesson.ProcessingStatus != ProcessingStatus.Ready
            || !await enrollments.IsActivelyEnrolledAsync(token.StudentId, lesson.CourseId, ct))
            throw new UnauthorizedException(NoAccess);

        if (lesson.ProcessedFileRef is null || !storage.Exists(lesson.ProcessedFileRef))
            throw new NotFoundException("This lesson's content is not available.");

        var contentType = lesson.ContentType == LessonContentType.Video ? "video/mp4" : "application/pdf";
        return new ContentFile(storage.GetPhysicalPath(lesson.ProcessedFileRef), contentType);
    }

    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
}