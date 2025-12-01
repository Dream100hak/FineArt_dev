namespace FineArt.Api.Contracts;

public record AuthResponse(string Token, DateTimeOffset ExpiresAt);
