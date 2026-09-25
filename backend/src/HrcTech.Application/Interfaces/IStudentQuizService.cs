using HrcTech.Application.DTOs.Quizzes;

namespace HrcTech.Application.Interfaces;

public interface IStudentQuizService
{
    Task<StudentQuizDto> GetAsync(Guid studentId, Guid courseId, CancellationToken ct);
    Task<QuizResultDto> SubmitAsync(Guid studentId, Guid courseId, QuizSubmitRequest request, CancellationToken ct);
}