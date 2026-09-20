using System.ComponentModel.DataAnnotations;

namespace HrcTech.Application.DTOs.Auth;

public sealed class LoginRequest
{
    [Required, EmailAddress, StringLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required, StringLength(100)]
    public string Password { get; init; } = string.Empty;
}