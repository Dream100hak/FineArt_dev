namespace FineArt.Domain;

public enum ExhibitionCategory
{
    Solo,
    Group,
    Digital,
    Installation
}

public class Exhibition
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Artist { get; set; } = string.Empty;
    public string Host { get; set; } = string.Empty;
    public string Participants { get; set; } = string.Empty;
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime EndDate { get; set; } = DateTime.UtcNow;
    public string ImageUrl { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public ExhibitionCategory Category { get; set; } = ExhibitionCategory.Group;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
