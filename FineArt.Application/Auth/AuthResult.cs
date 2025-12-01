namespace FineArt.Application.Auth;

public sealed record AuthResult(bool Success, string? Token, DateTimeOffset? ExpiresAt, string? Error)
{
    public static AuthResult Fail(string error) => new(false, null, null, error);
    public static AuthResult Ok(string token, DateTimeOffset expiresAt) => new(true, token, expiresAt, null);
}
