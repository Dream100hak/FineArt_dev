namespace FineArt.Api.Contracts;

public class BoardPostListQuery
{
    public int Page { get; set; } = 1;
    public int Size { get; set; } = 10;
    public string? Category { get; set; }
    public string? Keyword { get; set; }
    public string? Sort { get; set; }
}
