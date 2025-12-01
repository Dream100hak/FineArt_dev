namespace FineArt.Api.Contracts;

public class BoardListQuery
{
    public int Page { get; set; } = 1;
    public int Size { get; set; } = 20;
    public string? Keyword { get; set; }
    public string? Sort { get; set; }
    public bool IncludeHidden { get; set; } = false;
}
