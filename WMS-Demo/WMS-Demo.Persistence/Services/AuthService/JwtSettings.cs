namespace WMSDemo.Persistence.Services.AuthService;

public class JwtSettings
{
    public string Issuer { get; set; } = "WMS-Demo";
    public string Audience { get; set; } = "WMS-Demo.Frontend";
    public string SigningKey { get; set; } = "WMS-Demo-Development-Jwt-Signing-Key-2026-Change-Me";
    public int ExpiresHours { get; set; } = 8;
}
