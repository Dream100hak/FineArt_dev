using FineArt.Domain;
using Microsoft.EntityFrameworkCore;

namespace FineArt.Application.Exhibitions;

public class ExhibitionQueryService
{
    public async Task<(IReadOnlyList<Exhibition> Items, int TotalCount)> QueryAsync(
        IQueryable<Exhibition> source,
        string? category,
        string? keyword,
        int page,
        int size,
        CancellationToken cancellationToken = default)
    {
        if (page < 1)
        {
            page = 1;
        }

        if (size < 1)
        {
            size = 9;
        }

        var filtered = ApplyFilters(source, category, keyword);
        var totalCount = await filtered.CountAsync(cancellationToken);

        var ordered = filtered
            .OrderByDescending(e => e.CreatedAt)
            .ThenByDescending(e => e.StartDate)
            .ThenByDescending(e => e.Id);

        var skip = (page - 1) * size;
        var items = await ordered
            .Skip(skip)
            .Take(size)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public Task<Exhibition?> GetByIdAsync(
        IQueryable<Exhibition> source,
        int id,
        CancellationToken cancellationToken = default) =>
        source.AsNoTracking().FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

    private static IQueryable<Exhibition> ApplyFilters(
        IQueryable<Exhibition> query,
        string? category,
        string? keyword)
    {
        var normalizedCategory = NormalizeCategory(category);
        if (normalizedCategory is not null)
        {
            query = query.Where(e => e.Category == normalizedCategory);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var term = keyword.Trim();
            query = query.Where(e =>
                e.Title.Contains(term) ||
                e.Description.Contains(term) ||
                e.Artist.Contains(term) ||
                e.Host.Contains(term) ||
                e.Participants.Contains(term) ||
                e.Location.Contains(term));
        }

        return query;
    }

    private static ExhibitionCategory? NormalizeCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category))
        {
            return null;
        }

        return Enum.TryParse<ExhibitionCategory>(category.Trim(), ignoreCase: true, out var parsed)
            ? parsed
            : null;
    }
}
