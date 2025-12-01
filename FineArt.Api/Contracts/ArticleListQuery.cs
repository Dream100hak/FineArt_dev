namespace FineArt.Api.Contracts;

public class ArticleListQuery
{
  public int Page { get; set; } = 1;
  public int Size { get; set; } = 10;
  public int? BoardTypeId { get; set; }
  public string? BoardSlug { get; set; }
  public string? Category { get; set; }
  public string? Keyword { get; set; }
  public string? Sort { get; set; } 
}
