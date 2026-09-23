using HrcTech.Application.DTOs.Payments;

namespace HrcTech.Application.Interfaces;

public interface IPaymentService
{
    Task<PaymentCheckoutDto> CreateAsync(Guid studentId, CreatePaymentRequest request, CancellationToken ct);
    Task<PaymentDto> GetAsync(Guid studentId, Guid paymentId, CancellationToken ct);
    Task HandleWebhookAsync(string json, string signatureHeader, CancellationToken ct);
}