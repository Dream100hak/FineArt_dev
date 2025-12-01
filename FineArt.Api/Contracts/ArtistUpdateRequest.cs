namespace FineArt.Api.Contracts;

public record ArtistUpdateRequest(string Name, string Bio, string Nationality, string? ImageUrl);
