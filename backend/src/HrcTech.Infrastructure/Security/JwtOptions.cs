namespace HrcTech.Infrastructure.Security;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;   // comes from user-secrets or env, never appsettings
    public int AccessTokenMinutes { get; set; } = 15;
}