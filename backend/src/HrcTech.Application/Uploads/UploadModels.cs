namespace HrcTech.Application.Uploads;

public sealed record UploadedFile(Stream Content, string FileName, string ContentType, long Length);

public static class UploadLimits
{
    public const long MaxVideoBytes = 1L * 1024 * 1024 * 1024;        // 1 GiB
    public const long MaxPdfBytes = 100L * 1024 * 1024;               // 100 MiB
    public const long MaxThumbnailBytes = 2L * 1024 * 1024;           // 2 MiB
    public const long MaxRequestBytes = MaxVideoBytes + 16L * 1024 * 1024;   // room for multipart overhead
    public const long MaxThumbnailRequestBytes = MaxThumbnailBytes + 1L * 1024 * 1024;
}