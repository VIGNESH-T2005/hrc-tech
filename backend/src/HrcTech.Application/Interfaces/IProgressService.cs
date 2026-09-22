using HrcTech.Application.DTOs.Progress;

namespace HrcTech.Application.Interfaces;

public interface IProgressService
{
    Task<LessonProgressDto> UpdateAsync(Guid studentId, Guid lessonId, ProgressUpdateRequest request, CancellationToken ct);
    Task<CourseProgressDto> GetCourseProgressAsync(Guid studentId, Guid courseId, CancellationToken ct);
}