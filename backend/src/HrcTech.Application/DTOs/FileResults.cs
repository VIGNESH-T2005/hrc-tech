namespace HrcTech.Application.DTOs;

public sealed record ThumbnailFile(string PhysicalPath, string ContentType, string ETag, DateTime LastModifiedUtc);

public sealed record ContentFile(string PhysicalPath, string ContentType);