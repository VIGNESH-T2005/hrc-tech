namespace HrcTech.Domain.Entities;

// Guarantees a Stripe webhook retry never processes the same event twice.
public class WebhookEvent
{
    public Guid Id { get; set; }
    public string GatewayEventId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public DateTime ProcessedAt { get; set; }
}