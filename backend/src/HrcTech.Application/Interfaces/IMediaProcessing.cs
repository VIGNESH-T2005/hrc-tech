namespace HrcTech.Application.Interfaces;

public sealed record WatermarkText(string Brand, string Rights, string Teacher);

public sealed record VideoProbe(double DurationSeconds, int Width, int Height, bool HasAudio);

public interface IVideoProcessor
{
    Task<VideoProbe> ProbeAsync(string path, CancellationToken ct);
    Task WatermarkAsync(string inputPath, string outputPath, VideoProbe probe, WatermarkText text, CancellationToken ct);
}

public interface IPdfProcessor
{
    int ApplyWatermark(string inputPath, string outputPath, WatermarkText text);   // returns page count
    int CountPages(string path);
}