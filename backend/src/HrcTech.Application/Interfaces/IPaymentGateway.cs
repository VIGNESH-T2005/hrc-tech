namespace HrcTech.Application.Interfaces;

public sealed record CheckoutSessionRequest(Guid PaymentId, Guid StudentId, Guid CourseId, string CourseTitle, decimal AmountInr, string StudentEmail);

public sealed record CheckoutSessionResult(string SessionId, string CheckoutUrl);

// Verified webhook data, already authenticated by the gateway's signature check.
public sealed record GatewayWebhookEvent(
    string EventId, string Type, string? SessionId, string? PaymentIntentId,
    string? PaymentStatus, long? AmountReceivedMinor, string? Currency, IReadOnlyDictionary<string, string> Metadata);

public interface IPaymentGateway
{
    Task<CheckoutSessionResult> CreateCheckoutSessionAsync(CheckoutSessionRequest request, CancellationToken ct);

    // Throws if the signature is invalid. This is what makes the webhook trustworthy.
    GatewayWebhookEvent ParseWebhookEvent(string json, string signatureHeader);
}