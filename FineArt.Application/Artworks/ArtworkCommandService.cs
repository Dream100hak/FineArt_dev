using FineArt.Domain;
using Microsoft.EntityFrameworkCore;

namespace FineArt.Application.Artworks;

public class ArtworkCommandService
{
    private readonly DbContext _db;
    private readonly DbSet<Artwork> _artworks;

    public ArtworkCommandService(DbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _artworks = _db.Set<Artwork>();
    }

    public async Task<Artwork> CreateAsync(
        string title,
        string artistDisplayName,
        string description,
        string mainTheme,
        string? subTheme,
        string size,
        int? widthCm,
        int? heightCm,
        string? sizeBucket,
        string material,
        int price,
        bool isRentable,
        int? rentPrice,
        string? imageUrl,
        ArtworkStatus status,
        int artistId,
        CancellationToken cancellationToken = default)
    {
        var artwork = new Artwork
        {
            Title = title.Trim(),
            ArtistDisplayName = artistDisplayName.Trim(),
            Description = description.Trim(),
            MainTheme = mainTheme.Trim(),
            SubTheme = subTheme?.Trim() ?? string.Empty,
            Size = size.Trim(),
            WidthCm = NormalizeDimension(widthCm),
            HeightCm = NormalizeDimension(heightCm),
            SizeBucket = NormalizeSizeBucket(sizeBucket),
            Material = material.Trim(),
            Price = price,
            IsRentable = isRentable,
            RentPrice = isRentable ? rentPrice : null,
            ImageUrl = imageUrl?.Trim() ?? string.Empty,
            Status = status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            ArtistId = artistId
        };

        await _artworks.AddAsync(artwork, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        return artwork;
    }

    public async Task<Artwork?> UpdateAsync(
        int id,
        string title,
        string artistDisplayName,
        string description,
        string mainTheme,
        string? subTheme,
        string size,
        int? widthCm,
        int? heightCm,
        string? sizeBucket,
        string material,
        int price,
        bool isRentable,
        int? rentPrice,
        string? imageUrl,
        ArtworkStatus status,
        int artistId,
        CancellationToken cancellationToken = default)
    {
        var artwork = await _artworks.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (artwork is null)
        {
            return null;
        }

        artwork.Title = title.Trim();
        artwork.ArtistDisplayName = artistDisplayName.Trim();
        artwork.Description = description.Trim();
        artwork.MainTheme = mainTheme.Trim();
        artwork.SubTheme = subTheme?.Trim() ?? string.Empty;
        artwork.Size = size.Trim();
        artwork.WidthCm = NormalizeDimension(widthCm);
        artwork.HeightCm = NormalizeDimension(heightCm);
        artwork.SizeBucket = NormalizeSizeBucket(sizeBucket);
        artwork.Material = material.Trim();
        artwork.Price = price;
        artwork.IsRentable = isRentable;
        artwork.RentPrice = isRentable ? rentPrice : null;
        artwork.ImageUrl = imageUrl?.Trim() ?? string.Empty;
        artwork.Status = status;
        artwork.ArtistId = artistId;
        artwork.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return artwork;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var artwork = await _artworks.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (artwork is null)
        {
            return false;
        }

        _artworks.Remove(artwork);
        await _db.SaveChangesAsync(cancellationToken);

        return true;
    }

    private static int? NormalizeDimension(int? value) =>
        value.HasValue && value.Value > 0 ? value.Value : null;

    private static string NormalizeSizeBucket(string? value) =>
        string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();
}
