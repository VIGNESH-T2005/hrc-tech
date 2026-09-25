using HrcTech.Application.DTOs.Quizzes;

namespace HrcTech.Application.Interfaces;

public interface IAdminQuizService
{
    Task<AdminQuizDto?> GetAsync(Guid courseId, CancellationToken ct);
    Task<AdminQuizDto> UpsertAsync(Guid courseId, QuizUpsertRequest request, CancellationToken ct);
    Task DeleteAsync(Guid courseId, CancellationToken ct);
}