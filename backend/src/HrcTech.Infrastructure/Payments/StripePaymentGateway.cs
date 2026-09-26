using HrcTech.Application.Interfaces;
using HrcTech.Application.Settings;
using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Checkout;

namespace HrcTech.Infrastructure.Payments;

public sealed class StripePaymentGateway : IPaymentGateway
{
    private readonly StripeOptions _o;

    public StripePaymentGateway(IOptions<StripeOptions> options)
    {
        _o = options.Value;
        if (string.IsNullOrWhiteSpace(_o.SecretKey))
            throw new InvalidOperationException("Stripe:SecretKey is not configured.");

        StripeConfiguration.ApiKey = _o.SecretKey;
        
    }

    public async Task<CheckoutSessionResult> CreateCheckoutSessionAsync(CheckoutSessionRequest request, CancellationToken ct)
    {
        // Metadata is defense in depth: the webhook re-checks amount, course and student
        // against our own database, it never trusts these values alone.
        var options = new SessionCreateOptions
        {
            Mode = "payment",
            SuccessUrl = $"{_o.SuccessUrl}&courseId={request.CourseId}",
            CancelUrl = _o.CancelUrl,
            CustomerEmail = request.StudentEmail,
            ClientReferenceId = request.PaymentId.ToString(),
            Metadata = new Dictionary<string, string>
            {
                ["paymentId"] = request.PaymentId.ToString(),
                ["studentId"] = request.StudentId.ToString(),
                ["courseId"] = request.CourseId.ToString()
            },
            LineItems =
            [
                new SessionLineItemOptions
                {
                    Quantity = 1,
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency = "inr",
                        UnitAmount = ToPaise(request.AmountInr),
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = request.CourseTitle,
                            Description = "HRC TECH course access"
                        }
                    }
                }
            ]
        };

        var session = await new SessionService().CreateAsync(options, cancellationToken: ct);
        return new CheckoutSessionResult(session.Id, session.Url);
    }

    public GatewayWebhookEvent ParseWebhookEvent(string json, string signatureHeader)
    {
        if (string.IsNullOrWhiteSpace(_o.WebhookSecret))
            throw new InvalidOperationException("Stripe:WebhookSecret is not configured.");

        // Throws StripeException if the signature does not match. That exception is what
        // proves the request really came from Stripe and hasn't been tampered with.
        var stripeEvent = EventUtility.ConstructEvent(json, signatureHeader, _o.WebhookSecret, throwOnApiVersionMismatch: false);

        if (stripeEvent.Data.Object is Session session)
        {
            return new GatewayWebhookEvent(
                stripeEvent.Id, stripeEvent.Type, session.Id, session.PaymentIntentId,
                session.PaymentStatus, session.AmountTotal, session.Currency, Freeze(session.Metadata));
        }

        if (stripeEvent.Data.Object is PaymentIntent intent)
        {
            return new GatewayWebhookEvent(
                stripeEvent.Id, stripeEvent.Type, null, intent.Id,
                intent.Status, intent.AmountReceived, intent.Currency, Freeze(intent.Metadata));
        }

        return new GatewayWebhookEvent(stripeEvent.Id, stripeEvent.Type, null, null, null, null, null,
            new Dictionary<string, string>());
    }

    private static long ToPaise(decimal amountInr) => (long)Math.Round(amountInr * 100m, MidpointRounding.AwayFromZero);

    private static IReadOnlyDictionary<string, string> Freeze(IDictionary<string, string>? metadata) =>
        metadata is null ? new Dictionary<string, string>() : new Dictionary<string, string>(metadata);
}