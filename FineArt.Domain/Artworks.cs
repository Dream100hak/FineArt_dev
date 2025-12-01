namespace FineArt.Domain;

public enum ArtworkStatus
{
    ForSale,
    Sold,
    Rentable
}

public class Artwork
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ArtistDisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string MainTheme { get; set; } = string.Empty;
    public string SubTheme { get; set; } = string.Empty;
    public string Size { get; set; } = string.Empty;
    public int? WidthCm { get; set; }
    public int? HeightCm { get; set; }
    public string SizeBucket { get; set; } = string.Empty;
    public string Material { get; set; } = string.Empty;
    public int Price { get; set; }
    public bool IsRentable { get; set; }
    public int? RentPrice { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public ArtworkStatus Status { get; set; } = ArtworkStatus.ForSale;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public int ArtistId { get; set; }
    public Artist? Artist { get; set; }
}
