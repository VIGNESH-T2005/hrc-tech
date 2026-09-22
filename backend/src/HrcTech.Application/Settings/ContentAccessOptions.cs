namespace HrcTech.Application.Settings;

public sealed class ContentAccessOptions
{
    public const string SectionName = "ContentAccess";

    public int TokenMinutes { get; set; } = 5;
    public int VideoCompletionThresholdPercent { get; set; } = 90;   // "watched enough" to count as done
}