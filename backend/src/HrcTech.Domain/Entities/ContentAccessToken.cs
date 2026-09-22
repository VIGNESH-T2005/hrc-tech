namespace HrcTech.Domain.Entities;

public class ContentAccessToken
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid LessonId { get; set; }
    public string TokenHash { get; set; } = string.Empty;   // SHA-256; the raw token is never stored
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
}