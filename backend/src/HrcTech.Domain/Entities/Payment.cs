using HrcTech.Domain.Enums;

namespace HrcTech.Domain.Entities;

public class Payment
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Guid CourseId { get; set; }
    public string Gateway { get; set; } = "Stripe";
    public string? GatewayOrderId { get; set; }     // Stripe Checkout Session id
    public string? GatewayPaymentId { get; set; }   // Stripe PaymentIntent id, set once payment starts
    public decimal Amount { get; set; }             // INR, matches the course price at the time of purchase
    public string Currency { get; set; } = "INR";
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}