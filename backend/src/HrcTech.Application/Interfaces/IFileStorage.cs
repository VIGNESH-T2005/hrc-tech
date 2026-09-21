namespace HrcTech.Application.Interfaces;

// Local-disk implementation today. GetPhysicalPath exists because FFmpeg and PDFsharp need real files;
// a cloud implementation would stage files to a temp folder instead.
public interface IFileStorage
{
    Task SaveAsync(string relativePath, Stream content, long maxBytes, CancellationToken ct);
    Task<byte[]> ReadHeaderAsync(string relativePath, int count, CancellationToken ct);
    string GetPhysicalPath(string relativePath);
    bool Exists(string relativePath);
    long GetSize(string relativePath);
    void Delete(string relativePath);
    void DeleteDirectory(string relativeDirectory);
    string CreateTempDirectory();
    void DeleteTempDirectory(string physicalPath);
    void AdoptFile(string sourcePhysicalPath, string relativeTarget);
}