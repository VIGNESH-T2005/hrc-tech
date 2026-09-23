using System.ComponentModel.DataAnnotations;

namespace HrcTech.Application.DTOs.Payments;

public sealed class CreatePaymentRequest
{
    [Required]
    public Guid CourseId { get; init; }
}

public sealed record PaymentCheckoutDto(Guid PaymentId, string CheckoutUrl, decimal Amount, string Currency, string Status);

public sealed record PaymentDto(
    Guid Id, Guid CourseId, string CourseTitle, decimal Amount, string Currency,
    string Status, DateTime CreatedAt, DateTime UpdatedAt);