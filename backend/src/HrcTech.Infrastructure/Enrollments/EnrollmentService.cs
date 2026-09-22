using HrcTech.Application.DTOs.Enrollments;
using HrcTech.Application.Exceptions;
using HrcTech.Application.Interfaces;
using HrcTech.Domain.Constants;
using HrcTech.Domain.Entities;
using HrcTech.Domain.Enums;
using HrcTech.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HrcTech.Infrastructure.Enrollments;

public sealed class EnrollmentService(AppDbContext db, UserManager<ApplicationUser> userManager) : IEnrollmentService
{
    public async Task<EnrollmentDto> GrantAsync(GrantEnrollmentRequest request, CancellationToken ct)
    {
        var student = await userManager.FindByEmailAsync(request.StudentEmail.Trim())
            ?? throw new NotFoundException("No account exists with that email.");

        if (!await userManager.IsInRoleAsync(student, Roles.Student))
            throw new BadRequestException("Only student accounts can be enrolled.");

        var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == request.CourseId, ct)
            ?? throw new NotFoundException("Course not found.");

        if (await db.Enrollments.AnyAsync(e => e.StudentId == student.Id && e.CourseId == course.Id && e.Status == EnrollmentStatus.Active, ct))
            throw new ConflictException("This student is already enrolled in this course.");

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            StudentId = student.Id,
            CourseId = course.Id,
            PaymentId = null,   // admin-granted, no payment involved
            Status = EnrollmentStatus.Active,
            EnrolledAt = DateTime.UtcNow
        };

        db.Enrollments.Add(enrollment);
        await db.SaveChangesAsync(ct);

        return new EnrollmentDto(enrollment.Id, student.Id, student.Email ?? string.Empty, course.Id, course.Title, enrollment.Status.ToString(), enrollment.EnrolledAt);
    }

    public Task<bool> IsActivelyEnrolledAsync(Guid studentId, Guid courseId, CancellationToken ct) =>
        db.Enrollments.AnyAsync(e => e.StudentId == studentId && e.CourseId == courseId && e.Status == EnrollmentStatus.Active, ct);

    public async Task<IReadOnlyList<MyCourseDto>> GetMyCoursesAsync(Guid studentId, CancellationToken ct)
    {
        var rows = await db.Enrollments.AsNoTracking()
            .Where(e => e.StudentId == studentId && e.Status == EnrollmentStatus.Active)
            .OrderByDescending(e => e.EnrolledAt)
            .Select(e => new
            {
                e.CourseId,
                e.Course.Title,
                HasThumbnail = e.Course.ThumbnailRef != null,
                e.EnrolledAt,
                TotalLessons = e.Course.Lessons.Count(l => l.ProcessingStatus == Domain.Enums.ProcessingStatus.Ready),
                CompletedLessons = db.LessonProgress.Count(p => p.StudentId == studentId && p.CourseId == e.CourseId && p.IsCompleted)
            })
            .ToListAsync(ct);

        return rows.Select(r => new MyCourseDto(
            r.CourseId, r.Title,
            r.HasThumbnail ? $"/api/courses/{r.CourseId}/thumbnail" : null,
            r.TotalLessons, r.CompletedLessons, r.EnrolledAt)).ToList();
    }
}