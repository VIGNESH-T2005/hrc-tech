using HrcTech.Application.Exceptions;
using HrcTech.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stripe;

namespace HrcTech.Api.Controllers;

[ApiController]
[Route("api/payments")]
[AllowAnonymous]   // Stripe cannot send a JWT. The signature check below is the real authentication.
public class PaymentsWebhookController(IPaymentService payments, ILogger<PaymentsWebhookController> logger) : ControllerBase
{
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook(CancellationToken ct)
    {
        using var reader = new StreamReader(Request.Body);
        var json = await reader.ReadToEndAsync(ct);
        var signature = Request.Headers["Stripe-Signature"].ToString();

        try
        {
            await payments.HandleWebhookAsync(json, signature, ct);
            return Ok();   // Stripe requires a 2xx or it will keep retrying
        }
        catch (StripeException ex)
        {
            logger.LogWarning("Rejected a Stripe webhook with an invalid signature: {Message}", ex.Message);
            return BadRequest();
        }
        catch (AppException ex)
        {
            logger.LogWarning("Webhook processing error: {Message}", ex.Message);
            return BadRequest();
        }
    }
}