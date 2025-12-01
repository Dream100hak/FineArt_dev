using FineArt.Domain;
using Microsoft.EntityFrameworkCore;

namespace FineArt.Application.Exhibitions;

public class ExhibitionCommandService
{
    private readonly DbContext _db;
    private readonly DbSet<Exhibition> _exhibitions;

    public ExhibitionCommandService(DbContext dbContext)
    {
        _db = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        _exhibitions = _db.Set<Exhibition>();
    }

    public async Task<Exhibition> CreateAsync(
        string title,
        string description,
        string artist,
        string? host,
        string? participants,
        DateTime startDate,
        DateTime endDate,
        string? imageUrl,
        string location,
        string category,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var exhibition = new Exhibition
        {
            Title = title.Trim(),
            Description = description.Trim(),
            Artist = artist.Trim(),
            Host = (host ?? string.Empty).Trim(),
            Participants = (participants ?? string.Empty).Trim(),
            StartDate = NormalizeDate(startDate),
            EndDate = NormalizeDate(endDate),
            ImageUrl = imageUrl?.Trim() ?? string.Empty,
            Location = location.Trim(),
            Category = ParseCategory(category),
            CreatedAt = now
        };

        await _exhibitions.AddAsync(exhibition, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        return exhibition;
    }

    public async Task<Exhibition?> UpdateAsync(
        int id,
        string title,
        string description,
        string artist,
        string? host,
        string? participants,
        DateTime startDate,
        DateTime endDate,
        string? imageUrl,
        string location,
        string category,
        CancellationToken cancellationToken = default)
    {
        var exhibition = await _exhibitions.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        if (exhibition is null)
        {
            return null;
        }

        exhibition.Title = title.Trim();
        exhibition.Description = description.Trim();
        exhibition.Artist = artist.Trim();
        exhibition.Host = (host ?? string.Empty).Trim();
        exhibition.Participants = (participants ?? string.Empty).Trim();
        exhibition.StartDate = NormalizeDate(startDate);
        exhibition.EndDate = NormalizeDate(endDate);
        exhibition.ImageUrl = imageUrl?.Trim() ?? string.Empty;
        exhibition.Location = location.Trim();
        exhibition.Category = ParseCategory(category);

        await _db.SaveChangesAsync(cancellationToken);

        return exhibition;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var exhibition = await _exhibitions.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        if (exhibition is null)
        {
            return false;
        }

        _exhibitions.Remove(exhibition);
        await _db.SaveChangesAsync(cancellationToken);

        return true;
    }

    private static ExhibitionCategory ParseCategory(string? category)
    {
        if (!string.IsNullOrWhiteSpace(category) &&
            Enum.TryParse<ExhibitionCategory>(category.Trim(), ignoreCase: true, out var parsed))
        {
            return parsed;
        }

        return ExhibitionCategory.Group;
    }

    private static DateTime NormalizeDate(DateTime value) =>
        DateTime.SpecifyKind(value, DateTimeKind.Utc);
}
