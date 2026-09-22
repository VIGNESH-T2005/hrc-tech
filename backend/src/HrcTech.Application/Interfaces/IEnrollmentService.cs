using HrcTech.Application.DTOs.Enrollments;

namespace HrcTech.Application.Interfaces;

public interface IEnrollmentService
{
    Task<EnrollmentDto> GrantAsync(GrantEnrollmentRequest request, CancellationToken ct);
    Task<bool> IsActivelyEnrolledAsync(Guid studentId, Guid courseId, CancellationToken ct);
    Task<IReadOnlyList<MyCourseDto>> GetMyCoursesAsync(Guid studentId, CancellationToken ct);
}