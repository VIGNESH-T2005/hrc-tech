using HrcTech.Application.DTOs;
using HrcTech.Application.DTOs.Courses;

namespace HrcTech.Application.Interfaces;

public interface ICourseCatalogService
{
    Task<PagedResult<CourseSummaryDto>> GetPublishedAsync(CourseQuery query, CancellationToken ct);
    Task<CourseDetailDto> GetPublishedByIdAsync(Guid id, CancellationToken ct);
    Task<IReadOnlyList<string>> GetCategoriesAsync(CancellationToken ct);
    Task<ThumbnailFile> GetThumbnailAsync(Guid id, bool includeUnpublished, CancellationToken ct);
}