using HrcTech.Application.DTOs;
using HrcTech.Application.DTOs.Lessons;
using HrcTech.Application.Uploads;

namespace HrcTech.Application.Interfaces;

public interface IAdminLessonService
{
    Task<IReadOnlyList<AdminLessonDto>> ListAsync(Guid courseId, CancellationToken ct);
    Task<AdminLessonDto> CreateAsync(Guid courseId, LessonUpsertRequest request, CancellationToken ct);
    Task<AdminLessonDto> UpdateAsync(Guid id, LessonUpsertRequest request, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
    Task<IReadOnlyList<AdminLessonDto>> ReorderAsync(Guid courseId, LessonOrderRequest request, CancellationToken ct);
    Task<AdminLessonDto> UploadAsync(Guid id, UploadedFile file, CancellationToken ct);
    Task<AdminLessonDto> RetryProcessingAsync(Guid id, CancellationToken ct);
    Task<LessonStatusDto> GetStatusAsync(Guid id, CancellationToken ct);
    Task<ContentFile> GetPreviewAsync(Guid id, CancellationToken ct);
}