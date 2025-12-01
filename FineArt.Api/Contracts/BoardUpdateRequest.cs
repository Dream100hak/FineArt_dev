namespace FineArt.Api.Contracts;

public class BoardUpdateRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Description { get; set; }
    public string LayoutType { get; set; } = "list";
    public int OrderIndex { get; set; }
    public int? ParentId { get; set; }
    public bool IsVisible { get; set; } = true;
}
