using HrcTech.Domain.Enums;

namespace HrcTech.Domain.Entities;

public class Enrollment
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid CourseId { get; set; }
    public Course Course { get; set; } = null!;
    public Guid? PaymentId { get; set; }     // set by Phase 7's payment flow; null for admin-granted access
    public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Active;
    public DateTime EnrolledAt { get; set; }
}