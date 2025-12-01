namespace FineArt.Api.Contracts;

public record ExhibitionListQuery
{
    public int Page { get; init; } = 1;
    public int Size { get; init; } = 9;
    public string? Category { get; init; }
    public string? Keyword { get; init; }
}
