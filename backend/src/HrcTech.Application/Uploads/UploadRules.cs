using System.Text;
using HrcTech.Application.Exceptions;
using HrcTech.Domain.Enums;

namespace HrcTech.Application.Uploads;

public static class UploadRules
{
    private static readonly HashSet<string> VideoExtensions = new(StringComparer.OrdinalIgnoreCase) { ".mp4", ".m4v", ".mov", ".webm" };
    private static readonly HashSet<string> VideoMimeTypes = new(StringComparer.OrdinalIgnoreCase) { "video/mp4", "video/x-m4v", "video/quicktime", "video/webm" };
    private static readonly HashSet<string> ImageExtensions = new(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png" };
    private static readonly HashSet<string> ImageMimeTypes = new(StringComparer.OrdinalIgnoreCase) { "image/jpeg", "image/png" };
    private static readonly string[] QuickTimeAtoms = ["ftyp", "moov", "mdat", "wide", "free", "skip", "pnot"];

    public static long MaxBytesFor(LessonContentType type) =>
        type == LessonContentType.Video ? UploadLimits.MaxVideoBytes : UploadLimits.MaxPdfBytes;

    // Step 1: cheap checks on what the client claims (extension, MIME type, size).
    // The MIME type is client-supplied, so the real protection is the signature check plus processing.
    public static void ValidateLessonFile(UploadedFile file, LessonContentType type)
    {
        var extension = Path.GetExtension(file.FileName);
        var mime = NormalizeMime(file.ContentType);

        if (type == LessonContentType.Video)
        {
            if (!VideoExtensions.Contains(extension) || !VideoMimeTypes.Contains(mime))
                throw new BadRequestException("This lesson needs a video file (MP4, M4V, MOV or WebM).");
        }
        else if (!extension.Equals(".pdf", StringComparison.OrdinalIgnoreCase)
                 || !mime.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
        {
            throw new BadRequestException("This lesson needs a PDF file.");
        }

        CheckSize(file.Length, MaxBytesFor(type));
    }

    // Step 2: check the first bytes of the saved file (the "file signature").
    public static void ValidateLessonSignature(byte[] header, LessonContentType type, string extension)
    {
        var ok = type == LessonContentType.Pdf
            ? IsPdf(header)
            : extension.Equals(".webm", StringComparison.OrdinalIgnoreCase)
                ? IsWebM(header)
                : IsMp4OrMov(header, extension);

        if (!ok)
            throw new BadRequestException("The file's content does not match its type. Upload a real MP4, MOV, WebM or PDF file.");
    }

    public static void ValidateThumbnail(UploadedFile file)
    {
        if (!ImageExtensions.Contains(Path.GetExtension(file.FileName)) || !ImageMimeTypes.Contains(NormalizeMime(file.ContentType)))
            throw new BadRequestException("The thumbnail must be a JPEG or PNG image.");

        CheckSize(file.Length, UploadLimits.MaxThumbnailBytes);
    }

    public static string? DetectImageExtension(byte[] h)
    {
        if (h.Length >= 8 && h[0] == 0x89 && h[1] == 0x50 && h[2] == 0x4E && h[3] == 0x47
            && h[4] == 0x0D && h[5] == 0x0A && h[6] == 0x1A && h[7] == 0x0A) return ".png";

        if (h.Length >= 3 && h[0] == 0xFF && h[1] == 0xD8 && h[2] == 0xFF) return ".jpg";

        return null;
    }

    public static string SanitizeFileName(string name)
    {
        var fileName = Path.GetFileName(name.Replace('\\', '/'));
        var clean = new string(fileName.Where(c => !char.IsControl(c)).ToArray()).Trim();
        if (clean.Length > 255) clean = clean[..255];
        return clean.Length == 0 ? "upload" : clean;
    }

    private static void CheckSize(long length, long max)
    {
        if (length <= 0) throw new BadRequestException("The file is empty.");
        if (length > max)
            throw new PayloadTooLargeException($"The file is too large. The maximum for this type is {max / (1024 * 1024)} MB.");
    }

    private static string NormalizeMime(string mime)
    {
        var i = mime.IndexOf(';');
        return (i >= 0 ? mime[..i] : mime).Trim();
    }

    private static bool IsPdf(byte[] h) => h.AsSpan().IndexOf("%PDF-"u8) >= 0;   // header is the first 1024 bytes

    private static bool IsWebM(byte[] h) =>
        h.Length >= 4 && h[0] == 0x1A && h[1] == 0x45 && h[2] == 0xDF && h[3] == 0xA3;

    private static bool IsMp4OrMov(byte[] h, string extension)
    {
        if (h.Length < 12) return false;
        var atom = Encoding.ASCII.GetString(h, 4, 4);
        return extension.Equals(".mov", StringComparison.OrdinalIgnoreCase)
            ? QuickTimeAtoms.Contains(atom)
            : atom == "ftyp";
    }
}