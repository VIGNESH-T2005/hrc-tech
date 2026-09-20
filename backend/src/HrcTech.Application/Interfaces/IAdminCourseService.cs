using HrcTech.Application.DTOs.Courses;

namespace HrcTech.Application.Interfaces;

public interface IAdminCourseService
{
    Task<IReadOnlyList<AdminCourseDto>> ListAsync(CancellationToken ct);
    Task<AdminCourseDto> GetAsync(Guid id, CancellationToken ct);
    Task<AdminCourseDto> CreateAsync(Guid adminId, CourseUpsertRequest request, CancellationToken ct);
    Task<AdminCourseDto> UpdateAsync(Guid id, CourseUpsertRequest request, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
    Task<AdminCourseDto> SetPublishedAsync(Guid id, bool published, CancellationToken ct);
}