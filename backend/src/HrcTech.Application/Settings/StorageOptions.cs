namespace HrcTech.Application.Settings;

public sealed class StorageOptions
{
    public const string SectionName = "Storage";

    public string RootPath { get; set; } = string.Empty;   // private folder, never served statically
}