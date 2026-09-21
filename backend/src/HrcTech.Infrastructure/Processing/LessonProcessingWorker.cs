using HrcTech.Application.Interfaces;
using HrcTech.Application.Settings;
using HrcTech.Domain.Enums;
using HrcTech.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace HrcTech.Infrastructure.Processing;

public sealed class LessonProcessingWorker(
    ProcessingQueue queue,
    IServiceScopeFactory scopes,
    IOptions<ProcessingOptions> options,
    IFileStorage storage,
    ILogger<LessonProcessingWorker> logger) : BackgroundService
{
    private readonly ProcessingOptions _o = options.Value;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await CheckToolsAsync(stoppingToken);
        storage.DeleteDirectory("tmp");   // leftovers from a previous crash
        await RecoverAsync(stoppingToken);

        try
        {
            // One lesson at a time: FFmpeg already uses all CPU cores.
            await foreach (var lessonId in queue.ReadAllAsync(stoppingToken))
            {
                try
                {
                    await using var scope = scopes.CreateAsyncScope();
                    await scope.ServiceProvider.GetRequiredService<LessonProcessor>().ProcessAsync(lessonId, stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Unexpected error while processing lesson {LessonId}.", lessonId);
                }
            }
        }
        catch (OperationCanceledException)
        {
            // shutting down
        }
    }

    // After a restart, anything that was mid-processing goes back to the queue.
    private async Task RecoverAsync(CancellationToken ct)
    {
        try
        {
            await using var scope = scopes.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            await db.Lessons
                .Where(l => l.ProcessingStatus == ProcessingStatus.Processing)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(l => l.ProcessingStatus, ProcessingStatus.Queued)
                    .SetProperty(l => l.ProcessingStage, (string?)null), ct);

            var ids = await db.Lessons
                .Where(l => l.ProcessingStatus == ProcessingStatus.Queued)
                .Select(l => l.Id)
                .ToListAsync(ct);

            foreach (var id in ids) await queue.EnqueueAsync(id, ct);
            if (ids.Count > 0) logger.LogInformation("Re-queued {Count} lesson(s) after startup.", ids.Count);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Could not recover queued lessons.");
        }
    }

    private async Task CheckToolsAsync(CancellationToken ct)
    {
        foreach (var (name, path, setting) in new[]
                 {
                     ("ffmpeg", _o.FfmpegPath, "FfmpegPath"),
                     ("ffprobe", _o.FfprobePath, "FfprobePath")
                 })
        {
            try
            {
                var result = await ProcessRunner.RunAsync(path, ["-version"], null, TimeSpan.FromSeconds(15), ct);
                if (result.ExitCode != 0) logger.LogError("{Tool} returned an error. Video lessons may fail.", name);
            }
            catch (Exception ex) when (ex is Application.Exceptions.ProcessingException)
            {
                logger.LogError("{Tool} could not be started. Install it or fix Processing:{Setting}. Video lessons cannot be processed until then.", name, setting);
            }
        }

        if (string.IsNullOrWhiteSpace(_o.WatermarkFontPath) || !File.Exists(_o.WatermarkFontPath))
            logger.LogError("Processing:WatermarkFontPath is missing or wrong. No lesson can be watermarked until it is fixed.");
    }
}