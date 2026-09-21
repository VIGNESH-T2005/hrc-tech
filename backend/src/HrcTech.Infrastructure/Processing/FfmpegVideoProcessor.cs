using System.Globalization;
using System.Text;
using System.Text.Json;
using HrcTech.Application.Exceptions;
using HrcTech.Application.Interfaces;
using HrcTech.Application.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace HrcTech.Infrastructure.Processing;

public sealed class FfmpegVideoProcessor(IOptions<ProcessingOptions> options, ILogger<FfmpegVideoProcessor> logger) : IVideoProcessor
{
    private readonly ProcessingOptions _o = options.Value;

    public async Task<VideoProbe> ProbeAsync(string path, CancellationToken ct)
    {
        var result = await ProcessRunner.RunAsync(
            _o.FfprobePath,
            ["-v", "error", "-protocol_whitelist", "file", "-print_format", "json", "-show_format", "-show_streams", path],
            null, TimeSpan.FromMinutes(2), ct);

        if (result.ExitCode != 0)
        {
            logger.LogWarning("ffprobe failed: {Error}", Tail(result.StdErr));
            throw new ProcessingException("The video could not be read. Make sure it is a valid MP4, MOV or WebM file.");
        }

        try
        {
            return Parse(result.StdOut);
        }
        catch (ProcessingException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not parse ffprobe output.");
            throw new ProcessingException("The video could not be read. Make sure it is a valid MP4, MOV or WebM file.");
        }
    }

    public async Task WatermarkAsync(string inputPath, string outputPath, VideoProbe probe, WatermarkText text, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(_o.WatermarkFontPath) || !File.Exists(_o.WatermarkFontPath))
            throw new ProcessingException("The watermark font is not configured on the server (Processing:WatermarkFontPath).");

        // The job's temp folder is FFmpeg's working directory. The font and the text live there as plain files,
        // so the filter needs no path or text escaping at all.
        var workDir = Path.GetDirectoryName(outputPath)!;
        var utf8 = new UTF8Encoding(false);
        File.Copy(_o.WatermarkFontPath, Path.Combine(workDir, "font.ttf"), overwrite: true);
        File.WriteAllText(Path.Combine(workDir, "wm1.txt"), $"{text.Brand}  |  {text.Rights}", utf8);
        File.WriteAllText(Path.Combine(workDir, "wm2.txt"), $"Instructor: {text.Teacher}", utf8);
        File.WriteAllText(Path.Combine(workDir, "wm3.txt"), text.Brand, utf8);

        var args = new List<string>
        {
            "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
            "-protocol_whitelist", "file",
            "-i", inputPath,
            "-map", "0:v:0", "-map", "0:a:0?",
            "-map_metadata", "-1", "-map_chapters", "-1",
            "-vf", BuildFilter(probe),
            "-c:v", "libx264", "-preset", "veryfast",
            "-crf", _o.VideoCrf.ToString(CultureInfo.InvariantCulture),
            "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart",
            outputPath
        };

        var result = await ProcessRunner.RunAsync(_o.FfmpegPath, args, workDir, TimeSpan.FromMinutes(_o.VideoTimeoutMinutes), ct);

        if (result.ExitCode != 0 || !File.Exists(outputPath))
        {
            logger.LogError("ffmpeg failed (exit {Code}): {Error}", result.ExitCode, Tail(result.StdErr));
            throw new ProcessingException("The video could not be processed. Check that it is a standard MP4, MOV or WebM file and try again.");
        }
    }

    private static string BuildFilter(VideoProbe p)
    {
        var basis = Math.Max(240, Math.Min(p.Width, p.Height));
        var big = Math.Max(14, basis / 26);
        var small = Math.Max(11, basis / 36);
        var margin = Math.Max(10, basis / 40);
        var gap = (int)(small * 1.9);

        return string.Join(",",
            "scale=trunc(iw/2)*2:trunc(ih/2)*2",   // yuv420p needs even dimensions
            Draw("wm1.txt", big, "(w-text_w)/2", $"h-text_h-{margin + gap}", "0.70"),
            Draw("wm2.txt", small, "(w-text_w)/2", $"h-text_h-{margin}", "0.60"),
            Draw("wm3.txt", small, $"w-text_w-{margin}", margin.ToString(CultureInfo.InvariantCulture), "0.45"));
    }

    private static string Draw(string textFile, int size, string x, string y, string alpha)
    {
        var border = Math.Max(4, size / 4);
        return $"drawtext=fontfile=font.ttf:textfile={textFile}:expansion=none:fontsize={size}" +
               $":fontcolor=white@{alpha}:box=1:boxcolor=black@0.35:boxborderw={border}:x={x}:y={y}";
    }

    private static VideoProbe Parse(string json)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        JsonElement? video = null;
        var hasAudio = false;

        if (root.TryGetProperty("streams", out var streams))
        {
            foreach (var stream in streams.EnumerateArray())
            {
                var type = stream.TryGetProperty("codec_type", out var t) ? t.GetString() : null;
                if (type == "audio") hasAudio = true;
                if (type == "video" && video is null && !IsCoverArt(stream)) video = stream;
            }
        }

        if (video is null) throw new ProcessingException("The file does not contain a video stream.");

        var v = video.Value;
        var width = v.GetProperty("width").GetInt32();
        var height = v.GetProperty("height").GetInt32();
        var duration = ReadDuration(root, v);

        if (width <= 0 || height <= 0 || duration <= 0)
            throw new ProcessingException("The video's size or duration could not be determined.");

        return new VideoProbe(duration, width, height, hasAudio);
    }

    private static double ReadDuration(JsonElement root, JsonElement video)
    {
        if (root.TryGetProperty("format", out var format) && TryReadNumber(format, "duration", out var d)) return d;
        if (TryReadNumber(video, "duration", out d)) return d;
        return 0;
    }

    private static bool TryReadNumber(JsonElement element, string name, out double value)
    {
        value = 0;
        return element.TryGetProperty(name, out var p)
               && double.TryParse(p.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out value);
    }

    private static bool IsCoverArt(JsonElement stream) =>
        stream.TryGetProperty("disposition", out var d)
        && d.TryGetProperty("attached_pic", out var a)
        && a.GetInt32() == 1;

    private static string Tail(string text) => text.Length <= 2000 ? text : text[^2000..];
}