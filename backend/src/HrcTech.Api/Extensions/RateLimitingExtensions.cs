using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace HrcTech.Api.Extensions;

public static class RateLimitPolicies
{
    public const string AuthStrict = "auth-strict";     // login, register
    public const string AuthRefresh = "auth-refresh";   // refresh, logout
}

public static class RateLimitingExtensions
{
    public static IServiceCollection AddAuthRateLimiting(this IServiceCollection services, IConfiguration configuration)
    {
        var strictLimit = configuration.GetValue("RateLimiting:StrictPerMinute", 10);
        var refreshLimit = configuration.GetValue("RateLimiting:RefreshPerMinute", 30);

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (context, token) =>
            {
                context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                await context.HttpContext.Response.WriteAsJsonAsync(
                    new { message = "Too many requests. Please wait a moment and try again." }, token);
            };

            options.AddPolicy(RateLimitPolicies.AuthStrict, http => PartitionByIp(http, strictLimit));
            options.AddPolicy(RateLimitPolicies.AuthRefresh, http => PartitionByIp(http, refreshLimit));
        });

        return services;
    }

    private static RateLimitPartition<string> PartitionByIp(HttpContext http, int limit) =>
        RateLimitPartition.GetFixedWindowLimiter(
            http.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = limit,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            });
}