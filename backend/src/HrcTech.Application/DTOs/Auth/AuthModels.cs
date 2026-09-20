namespace HrcTech.Application.DTOs.Auth;

public sealed record UserDto(Guid Id, string Name, string Email, string Role, DateTime CreatedAt);

// This is what the client receives. The refresh token is never in the body, only in the httpOnly cookie.
public sealed record AuthResponse(string AccessToken, int ExpiresIn, UserDto User);

// Internal result. The controller turns RefreshToken into a cookie.
public sealed record AuthResult(AuthResponse Response, string RefreshToken, DateTime RefreshTokenExpiresAt);