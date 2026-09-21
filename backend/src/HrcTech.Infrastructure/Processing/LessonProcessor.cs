using HrcTech.Application.Exceptions;
using HrcTech.Application.Interfaces;
using HrcTech.Application.Settings;
using HrcTech.Domain.Constants;
using HrcTech.Domain.Enums;
using HrcTech.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace HrcTech.Infrastructure.Processing;

public sealed class LessonProcessor(
    AppDbContext db,
    IFileStorage storage,
    IVideoProcessor video,
    IPdfProcessor pdf,
    IOptions<ProcessingOptions> options,
    ILogger<LessonProcessor> logger)
{
    private const string StageValidating = "Validating";
    private const string StageWatermarking = "Watermarking";
    private const string StageVerifying = "Verifying";
    private const string StageStoring = "Storing";

    private readonly ProcessingOptions _o = options.Value;

    public async Task ProcessAsync(Guid lessonId, CancellationToken ct)
    {
        var lesson = await db.Lessons.AsNoTracking().Include(l => l.Course).FirstOrDefaultAsync(l => l.Id == lessonId, ct);
        if (lesson is null || lesson.ProcessingStatus != ProcessingStatus.Queued) return;

        // Claim the job atomically so the same lesson can never be processed twice.
        var claimed = await db.Lessons
            .Where(l => l.Id == lessonId && l.ProcessingStatus == ProcessingStatus.Queued)
            .ExecuteUpdateAsync(s => s
                .SetProperty(l => l.ProcessingStatus, ProcessingStatus.Processing)
                .SetProperty(l => l.ProcessingStage, StageValidating)
                .SetProperty(l => l.ProcessingError, (string?)null), ct);
        if (claimed == 0) return;

        if (string.IsNullOrEmpty(lesson.RawFileRef) || !storage.Exists(lesson.RawFileRef))
        {
            await FailAsync(lessonId, "The uploaded file is missing on the server. Please upload it again.");
            return;
        }

        var tempDir = storage.CreateTempDirectory();
        string? processedRef = null;

        try
        {
            var teacher = await db.Users.AsNoTracking()
                .Where(u => u.Id == lesson.Course.CreatedByAdminId)
                .Select(u => u.Name)
                .FirstOrDefaultAsync(ct);

            var text = new WatermarkText(Branding.AppName, Branding.RightsLine, string.IsNullOrWhiteSpace(teacher) ? Branding.AppName : teacher);
            var input = storage.GetPhysicalPath(lesson.RawFileRef);
            var isVideo = lesson.ContentType == LessonContentType.Video;
            var output = Path.Combine(tempDir, isVideo ? "out.mp4" : "out.pdf");

            int? duration = null;
            int? pages = null;

            if (isVideo)
            {
                var probe = await video.ProbeAsync(input, ct);
                ValidateVideo(probe);

                await SetStageAsync(lessonId, StageWatermarking, ct);
                await video.WatermarkAsync(input, output, probe, text, ct);

                await SetStageAsync(lessonId, StageVerifying, ct);
                var result = await video.ProbeAsync(output, ct);
                if (Math.Abs(result.DurationSeconds - probe.DurationSeconds) > Math.Max(2, probe.DurationSeconds * 0.02))
                    throw new ProcessingException("The processed video failed verification. Please try again.");

                duration = (int)Math.Round(result.DurationSeconds);
            }
            else
            {
                await SetStageAsync(lessonId, StageWatermarking, ct);
                pages = pdf.ApplyWatermark(input, output, text);

                await SetStageAsync(lessonId, StageVerifying, ct);
                if (pdf.CountPages(output) != pages)
                    throw new ProcessingException("The processed PDF failed verification. Please try again.");
            }

            // Only now does the file enter the protected "processed" area.
            await SetStageAsync(lessonId, StageStoring, ct);
            processedRef = $"processed/{lessonId}/{Guid.NewGuid():N}{(isVideo ? ".mp4" : ".pdf")}";
            storage.AdoptFile(output, processedRef);
            var size = storage.GetSize(processedRef);
            var now = DateTime.UtcNow;

            var committed = await db.Lessons
                .Where(l => l.Id == lessonId && l.ProcessingStatus == ProcessingStatus.Processing)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(l => l.ProcessedFileRef, processedRef)
                    .SetProperty(l => l.RawFileRef, (string?)null)
                    .SetProperty(l => l.ProcessedSizeBytes, (long?)size)
                    .SetProperty(l => l.DurationSeconds, duration)
                    .SetProperty(l => l.PageCount, pages)
                    .SetProperty(l => l.ProcessingStatus, ProcessingStatus.Ready)
                    .SetProperty(l => l.ProcessingStage, (string?)null)
                    .SetProperty(l => l.ProcessingError, (string?)null)
                    .SetProperty(l => l.ProcessedAt, (DateTime?)now)
                    .SetProperty(l => l.UpdatedAt, now), CancellationToken.None);

            if (committed == 0)
            {
                // The lesson was deleted while we worked. Throw the result away.
                storage.Delete(processedRef);
                logger.LogInformation("Lesson {LessonId} disappeared during processing. Result discarded.", lessonId);
                return;
            }

            // Old processed file (when a file was replaced) and the raw upload are no longer needed.
            if (lesson.ProcessedFileRef is not null) storage.Delete(lesson.ProcessedFileRef);
            storage.DeleteDirectory($"raw/{lessonId}");

            logger.LogInformation("Lesson {LessonId} is ready.", lessonId);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // Server is shutting down. Put the lesson back in the queue so it resumes after a restart.
            if (processedRef is not null) storage.Delete(processedRef);
            await db.Lessons
                .Where(l => l.Id == lessonId && l.ProcessingStatus == ProcessingStatus.Processing)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(l => l.ProcessingStatus, ProcessingStatus.Queued)
                    .SetProperty(l => l.ProcessingStage, (string?)null), CancellationToken.None);
            throw;
        }
        catch (ProcessingException ex)
        {
            logger.LogWarning("Lesson {LessonId} failed: {Message}", lessonId, ex.Message);
            if (processedRef is not null) storage.Delete(processedRef);
            await FailAsync(lessonId, ex.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lesson {LessonId} failed unexpectedly.", lessonId);
            if (processedRef is not null) storage.Delete(processedRef);
            await FailAsync(lessonId, "Processing failed unexpectedly. Please try again, or check the server log.");
        }
        finally
        {
            storage.DeleteTempDirectory(tempDir);
        }
    }

    private void ValidateVideo(VideoProbe probe)
    {
        if (probe.DurationSeconds > _o.MaxVideoMinutes * 60.0)
            throw new ProcessingException($"The video is too long (maximum {_o.MaxVideoMinutes} minutes).");

        if ((long)probe.Width * probe.Height > _o.MaxVideoPixels)
            throw new ProcessingException("The video resolution is too high. Export it at 4K (3840 x 2160) or lower.");
    }

    private Task SetStageAsync(Guid lessonId, string stage, CancellationToken ct) =>
        db.Lessons
            .Where(l => l.Id == lessonId && l.ProcessingStatus == ProcessingStatus.Processing)
            .ExecuteUpdateAsync(s => s
                .SetProperty(l => l.ProcessingStage, stage)
                .SetProperty(l => l.UpdatedAt, DateTime.UtcNow), ct);

    private Task FailAsync(Guid lessonId, string message)
    {
        var error = message.Length > 500 ? message[..500] : message;
        return db.Lessons
            .Where(l => l.Id == lessonId && l.ProcessingStatus == ProcessingStatus.Processing)
            .ExecuteUpdateAsync(s => s
                .SetProperty(l => l.ProcessingStatus, ProcessingStatus.Failed)
                .SetProperty(l => l.ProcessingStage, (string?)null)
                .SetProperty(l => l.ProcessingError, error)
                .SetProperty(l => l.UpdatedAt, DateTime.UtcNow), CancellationToken.None);
    }
}