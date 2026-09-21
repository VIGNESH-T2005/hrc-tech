using HrcTech.Application.DTOs;
using HrcTech.Application.DTOs.Lessons;
using HrcTech.Application.Exceptions;
using HrcTech.Application.Interfaces;
using HrcTech.Application.Uploads;
using HrcTech.Domain.Entities;
using HrcTech.Domain.Enums;
using HrcTech.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HrcTech.Infrastructure.Lessons;

public sealed class AdminLessonService(AppDbContext db, IFileStorage storage, IProcessingQueue queue) : IAdminLessonService
{
    public async Task<IReadOnlyList<AdminLessonDto>> ListAsync(Guid courseId, CancellationToken ct)
    {
        await EnsureCourseExistsAsync(courseId, ct);

        var lessons = await db.Lessons.AsNoTracking()
            .Where(l => l.CourseId == courseId)
            .OrderBy(l => l.LessonOrder)
            .ToListAsync(ct);

        return lessons.Select(ToDto).ToList();
    }

    public async Task<AdminLessonDto> CreateAsync(Guid courseId, LessonUpsertRequest request, CancellationToken ct)
    {
        await EnsureCourseExistsAsync(courseId, ct);

        var title = request.Title.Trim();
        if (title.Length < 2) throw new BadRequestException("Title must be at least 2 characters.");
        var description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

        // New lessons go to the end. Retry if two lessons are created at the same moment.
        for (var attempt = 0; attempt < 3; attempt++)
        {
            var next = (await db.Lessons.Where(l => l.CourseId == courseId).MaxAsync(l => (int?)l.LessonOrder, ct) ?? 0) + 1;
            var now = DateTime.UtcNow;

            var lesson = new Lesson
            {
                Id = Guid.NewGuid(),
                CourseId = courseId,
                Title = title,
                Description = description,
                LessonOrder = next,
                ContentType = request.ContentType,
                ProcessingStatus = ProcessingStatus.NoContent,
                CreatedAt = now,
                UpdatedAt = now
            };

            db.Lessons.Add(lesson);
            try
            {
                await db.SaveChangesAsync(ct);
                return ToDto(lesson);
            }
            catch (DbUpdateException)
            {
                db.Entry(lesson).State = EntityState.Detached;
            }
        }

        throw new ConflictException("The lesson could not be added. Please try again.");
    }

    public async Task<AdminLessonDto> UpdateAsync(Guid id, LessonUpsertRequest request, CancellationToken ct)
    {
        var lesson = await db.Lessons.FirstOrDefaultAsync(l => l.Id == id, ct)
            ?? throw new NotFoundException("Lesson not found.");

        var title = request.Title.Trim();
        if (title.Length < 2) throw new BadRequestException("Title must be at least 2 characters.");

        if (request.ContentType != lesson.ContentType && lesson.ProcessingStatus != ProcessingStatus.NoContent)
            throw new ConflictException("The content type cannot be changed after a file has been uploaded.");

        lesson.Title = title;
        lesson.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        lesson.ContentType = request.ContentType;
        lesson.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return ToDto(lesson);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct)
    {
        var lesson = await db.Lessons.Include(l => l.Course).FirstOrDefaultAsync(l => l.Id == id, ct)
            ?? throw new NotFoundException("Lesson not found.");

        if (lesson.ProcessingStatus == ProcessingStatus.Processing)
            throw new ConflictException("This lesson is being processed. Wait for it to finish, then delete it.");

        if (lesson.Course.IsPublished && await db.Lessons.CountAsync(l => l.CourseId == lesson.CourseId, ct) <= 1)
            throw new ConflictException("A published course must keep at least one lesson. Unpublish the course first.");

        db.Lessons.Remove(lesson);
        await db.SaveChangesAsync(ct);

        storage.DeleteDirectory($"raw/{id}");
        storage.DeleteDirectory($"processed/{id}");
    }

    public async Task<IReadOnlyList<AdminLessonDto>> ReorderAsync(Guid courseId, LessonOrderRequest request, CancellationToken ct)
    {
        await EnsureCourseExistsAsync(courseId, ct);

        var lessons = await db.Lessons.Where(l => l.CourseId == courseId).ToListAsync(ct);
        var ids = request.LessonIds;
        var known = lessons.Select(l => l.Id).ToHashSet();

        if (ids.Count != lessons.Count || ids.Distinct().Count() != ids.Count || !ids.All(known.Contains))
            throw new BadRequestException("The list must contain every lesson of this course exactly once.");

        var byId = lessons.ToDictionary(l => l.Id);

        // Two passes inside one transaction, because (CourseId, LessonOrder) is unique.
        await using var tx = await db.Database.BeginTransactionAsync(ct);

        for (var i = 0; i < ids.Count; i++) byId[ids[i]].LessonOrder = 1_000_000 + i;
        await db.SaveChangesAsync(ct);

        var now = DateTime.UtcNow;
        for (var i = 0; i < ids.Count; i++)
        {
            var lesson = byId[ids[i]];
            lesson.LessonOrder = i + 1;
            lesson.UpdatedAt = now;
        }
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return lessons.OrderBy(l => l.LessonOrder).Select(ToDto).ToList();
    }

    public async Task<AdminLessonDto> UploadAsync(Guid id, UploadedFile file, CancellationToken ct)
    {
        var lesson = await FindAsync(id, ct);

        if (lesson.ProcessingStatus is ProcessingStatus.Queued or ProcessingStatus.Processing)
            throw new ConflictException("This lesson is still being processed. Wait for it to finish before uploading again.");

        UploadRules.ValidateLessonFile(file, lesson.ContentType);

        // The raw upload goes to a private folder under a generated name. Nothing here is ever streamed to students.
        var rawRef = $"raw/{id}/{Guid.NewGuid():N}.upload";
        await storage.SaveAsync(rawRef, file.Content, UploadRules.MaxBytesFor(lesson.ContentType), ct);

        try
        {
            var header = await storage.ReadHeaderAsync(rawRef, 1024, ct);
            UploadRules.ValidateLessonSignature(header, lesson.ContentType, Path.GetExtension(file.FileName));
        }
        catch
        {
            storage.Delete(rawRef);
            throw;
        }

        var displayName = UploadRules.SanitizeFileName(file.FileName);
        var now = DateTime.UtcNow;

        // Atomic guard: only succeeds if the lesson is not queued or processing right now.
        var updated = await db.Lessons
            .Where(l => l.Id == id && l.ProcessingStatus != ProcessingStatus.Queued && l.ProcessingStatus != ProcessingStatus.Processing)
            .ExecuteUpdateAsync(s => s
                .SetProperty(l => l.RawFileRef, rawRef)
                .SetProperty(l => l.OriginalFileName, displayName)
                .SetProperty(l => l.ProcessingStatus, ProcessingStatus.Queued)
                .SetProperty(l => l.ProcessingStage, (string?)null)
                .SetProperty(l => l.ProcessingError, (string?)null)
                .SetProperty(l => l.UpdatedAt, now), ct);

        if (updated == 0)
        {
            storage.Delete(rawRef);
            throw new ConflictException("This lesson changed while uploading. Please try again.");
        }

        if (lesson.RawFileRef is not null) storage.Delete(lesson.RawFileRef);

        await queue.EnqueueAsync(id, ct);
        return ToDto(await FindAsync(id, ct));
    }

    public async Task<AdminLessonDto> RetryProcessingAsync(Guid id, CancellationToken ct)
    {
        var lesson = await FindAsync(id, ct);

        if (lesson.ProcessingStatus != ProcessingStatus.Failed)
            throw new ConflictException("Only lessons whose processing failed can be retried.");

        if (string.IsNullOrEmpty(lesson.RawFileRef) || !storage.Exists(lesson.RawFileRef))
            throw new ConflictException("The original upload is no longer on the server. Please upload the file again.");

        var updated = await db.Lessons
            .Where(l => l.Id == id && l.ProcessingStatus == ProcessingStatus.Failed)
            .ExecuteUpdateAsync(s => s
                .SetProperty(l => l.ProcessingStatus, ProcessingStatus.Queued)
                .SetProperty(l => l.ProcessingStage, (string?)null)
                .SetProperty(l => l.ProcessingError, (string?)null)
                .SetProperty(l => l.UpdatedAt, DateTime.UtcNow), ct);

        if (updated == 0) throw new ConflictException("The lesson changed. Please refresh and try again.");

        await queue.EnqueueAsync(id, ct);
        return ToDto(await FindAsync(id, ct));
    }

    public async Task<LessonStatusDto> GetStatusAsync(Guid id, CancellationToken ct)
    {
        var l = await FindAsync(id, ct);
        return new LessonStatusDto(l.Id, l.ProcessingStatus.ToString(), l.ProcessingStage, l.ProcessingError, l.DurationSeconds, l.PageCount, l.UpdatedAt);
    }

    // Admin-only quality check of the WATERMARKED file. Students get their own protected endpoint in Phase 6.
    public async Task<ContentFile> GetPreviewAsync(Guid id, CancellationToken ct)
    {
        var lesson = await FindAsync(id, ct);

        if (lesson.ProcessingStatus != ProcessingStatus.Ready || lesson.ProcessedFileRef is null || !storage.Exists(lesson.ProcessedFileRef))
            throw new ConflictException("This lesson has no processed content yet.");

        var contentType = lesson.ContentType == LessonContentType.Video ? "video/mp4" : "application/pdf";
        return new ContentFile(storage.GetPhysicalPath(lesson.ProcessedFileRef), contentType);
    }

    private async Task<Lesson> FindAsync(Guid id, CancellationToken ct) =>
        await db.Lessons.AsNoTracking().FirstOrDefaultAsync(l => l.Id == id, ct)
        ?? throw new NotFoundException("Lesson not found.");

    private async Task EnsureCourseExistsAsync(Guid courseId, CancellationToken ct)
    {
        if (!await db.Courses.AnyAsync(c => c.Id == courseId, ct))
            throw new NotFoundException("Course not found.");
    }

    private static AdminLessonDto ToDto(Lesson l) => new(
        l.Id, l.CourseId, l.Title, l.Description, l.LessonOrder, l.ContentType.ToString(),
        l.DurationSeconds, l.PageCount, l.ProcessingStatus.ToString(), l.ProcessingStage,
        l.ProcessingError, l.OriginalFileName, l.ProcessedSizeBytes,
        l.ProcessingStatus == ProcessingStatus.Ready, l.CreatedAt, l.UpdatedAt);
}