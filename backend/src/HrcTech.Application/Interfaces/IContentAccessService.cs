using HrcTech.Application.DTOs;
using HrcTech.Application.DTOs.Content;

namespace HrcTech.Application.Interfaces;

public interface IContentAccessService
{
    Task<ContentAccessDto> RequestAccessAsync(Guid studentId, Guid lessonId, CancellationToken ct);
    Task<ContentFile> GetStreamAsync(Guid lessonId, string rawToken, CancellationToken ct);
}