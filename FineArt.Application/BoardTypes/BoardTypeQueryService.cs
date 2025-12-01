using System.Collections.Generic;
using FineArt.Domain;
using Microsoft.EntityFrameworkCore;

namespace FineArt.Application.BoardTypes;

public class BoardTypeQueryService
{
    public async Task<(IReadOnlyList<BoardType> Items, int TotalCount)> QueryAsync(
        IQueryable<BoardType> source,
        string? keyword,
        string? sort,
        int page,
        int size,
        bool includeHidden = false,
        CancellationToken cancellationToken = default)
    {
        if (page < 1)
        {
            page = 1;
        }

        if (size < 1)
        {
            size = 10;
        }

        var filtered = ApplyFilters(source, keyword, includeHidden);
        var totalCount = await filtered.CountAsync(cancellationToken);
        var ordered = ApplySort(filtered, sort);
        var skip = (page - 1) * size;
        var items = await ordered.Skip(skip).Take(size).ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public Task<BoardType?> GetByIdAsync(
        IQueryable<BoardType> source,
        int id,
        CancellationToken cancellationToken = default) =>
        source.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

    public Task<BoardType?> GetBySlugAsync(
        IQueryable<BoardType> source,
        string slug,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(slug))
        {
            return Task.FromResult<BoardType?>(null);
        }

        var normalized = slug.Trim().ToLowerInvariant();
        return source.FirstOrDefaultAsync(
            b => b.Slug.ToLower() == normalized,
            cancellationToken);
    }

    public Task<List<BoardType>> GetAllAsync(
        IQueryable<BoardType> source,
        bool includeHidden,
        CancellationToken cancellationToken = default) =>
        ApplyFilters(source, null, includeHidden)
            .OrderBy(b => b.OrderIndex)
            .ThenBy(b => b.Name)
            .ToListAsync(cancellationToken);

    private static IQueryable<BoardType> ApplyFilters(
        IQueryable<BoardType> query,
        string? keyword,
        bool includeHidden)
    {
        if (!includeHidden)
        {
            query = query.Where(b => b.IsVisible);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var term = keyword.Trim();
            query = query.Where(b =>
                b.Name.Contains(term) ||
                b.Slug.Contains(term) ||
                (b.Description != null && b.Description.Contains(term)));
        }

        return query;
    }

    private static IQueryable<BoardType> ApplySort(IQueryable<BoardType> source, string? sort) =>
        sort switch
        {
            "-created" => source.OrderByDescending(b => b.CreatedAt).ThenByDescending(b => b.Id),
            "+created" => source.OrderBy(b => b.CreatedAt).ThenBy(b => b.Id),
            "-name" => source.OrderByDescending(b => b.Name).ThenByDescending(b => b.Id),
            "order" => source.OrderBy(b => b.OrderIndex).ThenBy(b => b.Name),
            _ => source.OrderBy(b => b.Name).ThenBy(b => b.Id)
        };
}
