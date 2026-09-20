namespace HrcTech.Application.Settings;

public sealed class AuthOptions
{
    public const string SectionName = "Auth";

    public int RefreshTokenDays { get; set; } = 7;
    public string RefreshCookieName { get; set; } = "hrc_refresh";
    public bool RefreshCookieSecure { get; set; } = true;
    public string RefreshCookieSameSite { get; set; } = "Lax";   // "None" is only needed if the SPA and API sit on different sites (requires Secure)
}