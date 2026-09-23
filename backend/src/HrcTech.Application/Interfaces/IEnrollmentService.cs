using HrcTech.Application.DTOs.Enrollments;

namespace HrcTech.Application.Interfaces;

public interface IEnrollmentService
{
    Task<EnrollmentDto> GrantAsync(GrantEnrollmentRequest request, CancellationToken ct);
    Task<bool> IsActivelyEnrolledAsync(Guid studentId, Guid courseId, CancellationToken ct);
    // Used only by the payment webhook. Idempotent: calling it twice for the same
    // student/course does nothing the second time, and never throws.
    Task EnsureEnrolledFromPaymentAsync(Guid studentId, Guid courseId, Guid paymentId, CancellationToken ct);
    Task<IReadOnlyList<MyCourseDto>> GetMyCoursesAsync(Guid studentId, CancellationToken ct);
}