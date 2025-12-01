using FineArt.Domain;
using Microsoft.EntityFrameworkCore;

namespace FineArt.Application.Artworks;

public class ArtworkQueryService
{
    public async Task<(IReadOnlyList<Artwork> Items, int TotalCount)> QueryAsync(
        IQueryable<Artwork> source,
        string? keyword,
        string? theme,
        string? sizeFilter,
        string? material,
        bool? rentableOnly,
        int? priceMin,
        int? priceMax,
        string? status,
        string? sort,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        if (page < 1)
        {
            page = 1;
        }

        if (pageSize < 1)
        {
            pageSize = 12;
        }

        var filtered = ApplyFilters(
            source,
            keyword,
            theme,
            sizeFilter,
            material,
            rentableOnly,
            priceMin,
            priceMax,
            status);
        var totalCount = await filtered.CountAsync(cancellationToken);

        var ordered = ApplySort(filtered, sort);
        var skip = (page - 1) * pageSize;
        var items = await ordered.Skip(skip).Take(pageSize).ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    private static IQueryable<Artwork> ApplyFilters(
        IQueryable<Artwork> query,
        string? keyword,
        string? theme,
        string? sizeFilter,
        string? material,
        bool? rentableOnly,
        int? priceMin,
        int? priceMax,
        string? status)
    {
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var term = keyword.Trim();
            query = query.Where(a =>
                a.Title.Contains(term) ||
                a.ArtistDisplayName.Contains(term) ||
                a.Description.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(theme))
        {
            var normalizedTheme = theme.Trim();
            query = query.Where(a => a.MainTheme == normalizedTheme);
        }

        if (!string.IsNullOrWhiteSpace(sizeFilter))
        {
            var normalizedSize = sizeFilter.Trim();
            query = query.Where(a =>
                (!string.IsNullOrWhiteSpace(a.SizeBucket) && a.SizeBucket == normalizedSize) ||
                a.Size.Contains(normalizedSize));
        }

        if (!string.IsNullOrWhiteSpace(material))
        {
            var normalizedMaterials = material
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            if (normalizedMaterials.Count > 0)
            {
                query = query.Where(a => normalizedMaterials.Contains(a.Material));
            }
        }

        if (rentableOnly.HasValue)
        {
            query = query.Where(a => a.IsRentable == rentableOnly.Value);
        }

        if (priceMin.HasValue)
        {
            query = query.Where(a => a.Price >= priceMin.Value);
        }

        if (priceMax.HasValue)
        {
            query = query.Where(a => a.Price <= priceMax.Value);
        }

        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<ArtworkStatus>(status, ignoreCase: true, out var parsedStatus))
        {
            query = query.Where(a => a.Status == parsedStatus);
        }

        return query;
    }

    private static IQueryable<Artwork> ApplySort(IQueryable<Artwork> query, string? sort) =>
        sort switch
        {
            "created" => query.OrderByDescending(a => a.CreatedAt).ThenByDescending(a => a.Id),
            "-price" => query.OrderByDescending(a => a.Price).ThenByDescending(a => a.Id),
            "+price" => query.OrderBy(a => a.Price).ThenByDescending(a => a.Id),
            _ => query.OrderByDescending(a => a.Id)
        };
}
