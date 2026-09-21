namespace HrcTech.Application.Settings;

public sealed class ProcessingOptions
{
    public const string SectionName = "Processing";

    public string FfmpegPath { get; set; } = "ffmpeg";
    public string FfprobePath { get; set; } = "ffprobe";
    public string WatermarkFontPath { get; set; } = string.Empty;
    public int VideoTimeoutMinutes { get; set; } = 120;
    public int MaxVideoMinutes { get; set; } = 240;
    public int MaxVideoPixels { get; set; } = 8_294_400;   // 3840 x 2160
    public int MaxPdfPages { get; set; } = 1000;
    public int VideoCrf { get; set; } = 23;
}