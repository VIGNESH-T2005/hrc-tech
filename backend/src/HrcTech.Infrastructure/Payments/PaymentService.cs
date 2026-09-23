using HrcTech.Application.DTOs.Payments;
using HrcTech.Application.Exceptions;
using HrcTech.Application.Interfaces;
using HrcTech.Domain.Entities;
using HrcTech.Domain.Enums;
using HrcTech.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HrcTech.Infrastructure.Payments;

public sealed class PaymentService(
    AppDbContext db, IPaymentGateway gateway, IEnrollmentService enrollments,
    UserManager<ApplicationUser> userManager, ILogger<PaymentService> logger) : IPaymentService
{
    private static readonly TimeSpan PendingReuseWindow = TimeSpan.FromMinutes(30);

    public async Task<PaymentCheckoutDto> CreateAsync(Guid studentId, CreatePaymentRequest request, CancellationToken ct)
    {
        var course = await db.Courses.AsNoTracking().FirstOrDefaultAsync(c => c.Id == request.CourseId && c.IsPublished, ct)
            ?? throw new NotFoundException("Course not found.");

        if (await enrollments.IsActivelyEnrolledAsync(studentId, course.Id, ct))
            throw new ConflictException("You are already enrolled in this course.");

        var student = await userManager.FindByIdAsync(studentId.ToString())
            ?? throw new UnauthorizedException("Your session has expired. Please sign in again.");

        var now = DateTime.UtcNow;

        // Reusing a recent Pending payment is what makes double-clicking "Buy Now" or "Retry" safe:
        // it never creates two Payment rows for the same purchase attempt.
        var payment = await db.Payments.FirstOrDefaultAsync(p =>
            p.StudentId == studentId && p.CourseId == course.Id &&
            p.Status == PaymentStatus.Pending && p.CreatedAt > now - PendingReuseWindow, ct);

        if (payment is null)
        {
            payment = new Payment
            {
                Id = Guid.NewGuid(),
                StudentId = studentId,
                CourseId = course.Id,
                Amount = course.Price,
                Currency = "INR",
                Status = PaymentStatus.Pending,
                CreatedAt = now,
                UpdatedAt = now
            };
            db.Payments.Add(payment);
        }
        else
        {
            payment.UpdatedAt = now;   // price may have changed since the first attempt; amount is fixed at creation
        }

        var session = await gateway.CreateCheckoutSessionAsync(
            new CheckoutSessionRequest(payment.Id, studentId, course.Id, course.Title, payment.Amount, student.Email ?? string.Empty), ct);

        payment.GatewayOrderId = session.SessionId;
        await db.SaveChangesAsync(ct);

        return new PaymentCheckoutDto(payment.Id, session.CheckoutUrl, payment.Amount, payment.Currency, payment.Status.ToString());
    }

    public async Task<PaymentDto> GetAsync(Guid studentId, Guid paymentId, CancellationToken ct)
    {
        var row = await db.Payments.AsNoTracking()
            .Where(p => p.Id == paymentId && p.StudentId == studentId)
            .Select(p => new { p.Id, p.CourseId, p.Course.Title, p.Amount, p.Currency, p.Status, p.CreatedAt, p.UpdatedAt })
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("Payment not found.");

        return new PaymentDto(row.Id, row.CourseId, row.Title, row.Amount, row.Currency, row.Status.ToString(), row.CreatedAt, row.UpdatedAt);
    }

    public async Task HandleWebhookAsync(string json, string signatureHeader, CancellationToken ct)
    {
        var evt = gateway.ParseWebhookEvent(json, signatureHeader);   // throws on a bad signature

        // Idempotency: if Stripe sends this event again (its documented retry behavior), do nothing.
        if (await db.WebhookEvents.AnyAsync(w => w.GatewayEventId == evt.EventId, ct)) return;

        db.WebhookEvents.Add(new WebhookEvent { Id = Guid.NewGuid(), GatewayEventId = evt.EventId, Type = evt.Type, ProcessedAt = DateTime.UtcNow });

        switch (evt.Type)
        {
            case "checkout.session.completed" when evt.PaymentStatus == "paid":
                await MarkSuccessfulAsync(evt, ct);
                break;

            case "checkout.session.async_payment_failed":
            case "payment_intent.payment_failed":
                await MarkFailedAsync(evt, ct);
                break;

            default:
                logger.LogInformation("Unhandled Stripe event type: {Type}", evt.Type);
                break;
        }

        await db.SaveChangesAsync(ct);   // commits the WebhookEvent row even for an event type we don't act on
    }

    private async Task MarkSuccessfulAsync(GatewayWebhookEvent evt, CancellationToken ct)
    {
        var payment = await ResolvePaymentAsync(evt, ct);
        if (payment is null) return;

        if (payment.Status == PaymentStatus.Successful) return;   // already processed; nothing to do

        // Verify the amount and currency the customer actually paid match what we expect.
        // The frontend's "success" redirect is never trusted; only this check is.
        if (evt.AmountReceivedMinor is long paise && Math.Round(paise / 100m, 2) != payment.Amount)
        {
            logger.LogError("Payment {PaymentId}: amount mismatch. Expected {Expected}, got {Actual} paise.",
                payment.Id, payment.Amount, evt.AmountReceivedMinor);
            payment.Status = PaymentStatus.Failed;
            payment.UpdatedAt = DateTime.UtcNow;
            return;
        }

        if (evt.Currency is not null && !evt.Currency.Equals("inr", StringComparison.OrdinalIgnoreCase))
        {
            logger.LogError("Payment {PaymentId}: currency mismatch ({Currency}).", payment.Id, evt.Currency);
            payment.Status = PaymentStatus.Failed;
            payment.UpdatedAt = DateTime.UtcNow;
            return;
        }

        payment.Status = PaymentStatus.Successful;
        payment.GatewayPaymentId = evt.PaymentIntentId ?? payment.GatewayPaymentId;
        payment.UpdatedAt = DateTime.UtcNow;

        await enrollments.EnsureEnrolledFromPaymentAsync(payment.StudentId, payment.CourseId, payment.Id, ct);
        logger.LogInformation("Payment {PaymentId} succeeded and enrollment was confirmed.", payment.Id);
    }

    private async Task MarkFailedAsync(GatewayWebhookEvent evt, CancellationToken ct)
    {
        var payment = await ResolvePaymentAsync(evt, ct);
        if (payment is null || payment.Status != PaymentStatus.Pending) return;   // don't overwrite a Successful payment

        payment.Status = PaymentStatus.Failed;
        payment.UpdatedAt = DateTime.UtcNow;
    }

    private async Task<Payment?> ResolvePaymentAsync(GatewayWebhookEvent evt, CancellationToken ct)
    {
        if (evt.Metadata.TryGetValue("paymentId", out var raw) && Guid.TryParse(raw, out var id))
        {
            var byId = await db.Payments.FirstOrDefaultAsync(p => p.Id == id, ct);
            if (byId is not null) return byId;
        }

        // Fallback for event types with no metadata (e.g. payment_intent.payment_failed), matched by gateway id.
        if (evt.SessionId is not null)
        {
            var bySession = await db.Payments.FirstOrDefaultAsync(p => p.GatewayOrderId == evt.SessionId, ct);
            if (bySession is not null) return bySession;
        }

        if (evt.PaymentIntentId is not null)
            return await db.Payments.FirstOrDefaultAsync(p => p.GatewayPaymentId == evt.PaymentIntentId, ct);

        return null;
    }
}