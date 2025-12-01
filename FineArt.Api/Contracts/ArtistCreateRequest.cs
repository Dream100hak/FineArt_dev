namespace FineArt.Api.Contracts;

public record ArtistCreateRequest(string Name, string Bio, string Nationality, string? ImageUrl);
