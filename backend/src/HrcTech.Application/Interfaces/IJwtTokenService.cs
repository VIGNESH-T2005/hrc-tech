using HrcTech.Domain.Entities;

namespace HrcTech.Application.Interfaces;

public interface IJwtTokenService
{
    string CreateAccessToken(ApplicationUser user, IEnumerable<string> roles);
}