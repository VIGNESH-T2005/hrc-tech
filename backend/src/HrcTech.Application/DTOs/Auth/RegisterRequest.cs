using System.ComponentModel.DataAnnotations;

namespace HrcTech.Application.DTOs.Auth;

// There is deliberately NO role property. Unknown JSON fields such as "role" are ignored.
public sealed class RegisterRequest
{
    [Required, StringLength(100, MinimumLength = 2)]
    public string Name { get; init; } = string.Empty;

    [Required, EmailAddress, StringLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required, StringLength(100, MinimumLength = 8)]
    public string Password { get; init; } = string.Empty;
}