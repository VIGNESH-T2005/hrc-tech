namespace HrcTech.Application.Settings;

public sealed class StripeOptions
{
    public const string SectionName = "Stripe";

    public string SecretKey { get; set; } = string.Empty;
    public string WebhookSecret { get; set; } = string.Empty;
    public string SuccessUrl { get; set; } = "http://localhost:5173/payment/result?session_id={CHECKOUT_SESSION_ID}";
    public string CancelUrl { get; set; } = "http://localhost:5173/payment/result?cancelled=true";
}