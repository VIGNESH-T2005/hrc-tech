using System.Security.Claims;
using HrcTech.Application.Exceptions;

namespace HrcTech.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user) =>
        Guid.TryParse(user.FindFirstValue("sub"), out var id)
            ? id
            : throw new UnauthorizedException("Authentication is required.");
}