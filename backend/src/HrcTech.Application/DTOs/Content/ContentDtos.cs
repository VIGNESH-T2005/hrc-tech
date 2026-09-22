namespace HrcTech.Application.DTOs.Content;

public sealed record ContentAccessDto(string StreamUrl, int ExpiresIn, string ContentType);