using HrcTech.Api.Extensions;
using HrcTech.Application.DTOs.Payments;
using HrcTech.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace HrcTech.Api.Controllers;

[ApiController]
[Route("api/payments")]
[Authorize(Policy = PolicyNames.StudentOnly)]
public class PaymentsController(IPaymentService payments) : ControllerBase
{
    // Called for both "Buy Now" and "Retry Payment" — the service decides whether to
    // reuse a recent pending attempt or start a new one, so double-clicks are always safe.
    [HttpPost("create")]
    [EnableRateLimiting(RateLimitPolicies.AuthStrict)]
    public async Task<IActionResult> Create(CreatePaymentRequest request, CancellationToken ct) =>
        Ok(await payments.CreateAsync(User.GetUserId(), request, ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct) =>
        Ok(await payments.GetAsync(User.GetUserId(), id, ct));
}