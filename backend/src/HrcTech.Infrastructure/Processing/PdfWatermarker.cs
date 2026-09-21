using HrcTech.Application.Exceptions;
using HrcTech.Application.Interfaces;
using HrcTech.Application.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PdfSharp.Drawing;
using PdfSharp.Fonts;
using PdfSharp.Pdf;
using PdfSharp.Pdf.IO;

namespace HrcTech.Infrastructure.Processing;

public sealed class PdfWatermarker(IOptions<ProcessingOptions> options, ILogger<PdfWatermarker> logger) : IPdfProcessor
{
    private const string FontFamily = "HrcWatermark";
    private readonly ProcessingOptions _o = options.Value;

    public int ApplyWatermark(string inputPath, string outputPath, WatermarkText text)
    {
        PdfFontBootstrap.Ensure(_o.WatermarkFontPath);

        PdfDocument document;
        try
        {
            document = PdfReader.Open(inputPath, PdfDocumentOpenMode.Modify);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "The PDF could not be opened.");
            throw new ProcessingException("This PDF could not be read. It may be password-protected, damaged or use unsupported features. Re-save it as a standard PDF and upload it again.");
        }

        using (document)
        {
            var pages = document.PageCount;
            if (pages == 0) throw new ProcessingException("The PDF has no pages.");
            if (pages > _o.MaxPdfPages) throw new ProcessingException($"The PDF has too many pages (maximum {_o.MaxPdfPages}).");

            try
            {
                for (var i = 0; i < pages; i++) Stamp(document.Pages[i], text);
                document.Save(outputPath);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Watermarking the PDF failed.");
                throw new ProcessingException("The PDF could not be watermarked. Re-save it as a standard PDF and upload it again.");
            }

            return pages;
        }
    }

    public int CountPages(string path)
    {
        try
        {
            using var document = PdfReader.Open(path, PdfDocumentOpenMode.Import);
            return document.PageCount;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "The processed PDF could not be re-opened.");
            throw new ProcessingException("The processed PDF failed verification. Please try again.");
        }
    }

    private static void Stamp(PdfPage page, WatermarkText text)
    {
        double w = page.Width.Point, h = page.Height.Point;
        var min = Math.Min(w, h);

        var big = new XFont(FontFamily, Math.Max(20, min / 10), XFontStyleEx.Bold);
        var mid = new XFont(FontFamily, Math.Max(12, min / 17), XFontStyleEx.Bold);
        var small = new XFont(FontFamily, Math.Max(7, min / 70), XFontStyleEx.Bold);

        var faint = new XSolidBrush(XColor.FromArgb(48, 120, 120, 120));
        var footer = new XSolidBrush(XColor.FromArgb(150, 70, 70, 70));

        using var gfx = XGraphics.FromPdfPage(page, XGraphicsPdfPageOptions.Append);

        // Large diagonal mark across the middle of the page.
        var state = gfx.Save();
        gfx.RotateAtTransform(-35, new XPoint(w / 2, h / 2));
        gfx.DrawString(text.Brand, big, faint, new XRect(0, h / 2 - big.Height, w, big.Height), XStringFormats.Center);
        gfx.DrawString(text.Rights, mid, faint, new XRect(0, h / 2, w, mid.Height), XStringFormats.Center);
        gfx.Restore(state);

        // Small line at the bottom, so a cropped copy still carries the mark.
        var line = $"{text.Brand}  |  {text.Rights}  |  {text.Teacher}";
        gfx.DrawString(line, small, footer, new XRect(0, h - small.Height * 2.2, w, small.Height * 1.6), XStringFormats.Center);
    }
}

// PDFsharp's Core build has no built-in fonts. Every request is answered with the one configured TTF file.
internal sealed class WatermarkFontResolver(byte[] fontData) : IFontResolver
{
    private const string FaceName = "HrcWatermarkFace";

    public FontResolverInfo? ResolveTypeface(string familyName, bool bold, bool italic) =>
        new(FaceName, false, false);

    public byte[]? GetFont(string faceName) => faceName == FaceName ? fontData : null;
}

internal static class PdfFontBootstrap
{
    private static readonly object Gate = new();
    private static bool _registered;

    public static void Ensure(string fontPath)
    {
        if (_registered) return;

        lock (Gate)
        {
            if (_registered) return;

            if (string.IsNullOrWhiteSpace(fontPath) || !File.Exists(fontPath))
                throw new ProcessingException("The watermark font is not configured on the server (Processing:WatermarkFontPath).");

            GlobalFontSettings.FontResolver = new WatermarkFontResolver(File.ReadAllBytes(fontPath));
            _registered = true;
        }
    }
}