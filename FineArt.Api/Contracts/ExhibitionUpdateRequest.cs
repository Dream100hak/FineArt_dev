namespace FineArt.Api.Contracts;

public record ExhibitionUpdateRequest(
    string Title,
    string Description,
    string Artist,
    string? Host,
    string? Participants,
    DateTime StartDate,
    DateTime EndDate,
    string? ImageUrl,
    string Location,
    string Category);
