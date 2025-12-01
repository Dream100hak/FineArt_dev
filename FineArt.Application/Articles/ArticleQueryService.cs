using FineArt.Domain;
using Microsoft.EntityFrameworkCore;

namespace FineArt.Application.Articles;

public class ArticleQueryService
{
    public async Task<(IReadOnlyList<Article> Items, int TotalCount)> QueryAsync(
        IQueryable<Article> source,
        int? boardTypeId,
        string? boardSlug,
        string? category,
        string? keyword,
        string? sort,
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
            size = 10;
        }

        var filtered = ApplyFilters(source, boardTypeId, boardSlug, category, keyword);
        var totalCount = await filtered.CountAsync(cancellationToken);

        var ordered = ApplySort(filtered, sort);
        var skip = (page - 1) * size;
        var items = await ordered
            .Skip(skip)
            .Take(size)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public Task<Article?> GetByIdAsync(
        IQueryable<Article> source,
        int id,
        CancellationToken cancellationToken = default) =>
        source.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

    private static IQueryable<Article> ApplyFilters(
        IQueryable<Article> query,
        int? boardTypeId,
        string? boardSlug,
        string? category,
        string? keyword)
    {
        if (boardTypeId.HasValue)
        {
            query = query.Where(a => a.BoardTypeId == boardTypeId.Value);
        }

        if (!string.IsNullOrWhiteSpace(boardSlug))
        {
            var normalizedSlug = boardSlug.Trim().ToLower();
            query = query.Where(a => a.BoardType.Slug.ToLower() == normalizedSlug);
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            var normalizedCategory = category.Trim().ToLower();
            query = query.Where(a => a.Category == normalizedCategory);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var term = keyword.Trim();
            query = query.Where(a =>
                a.Title.Contains(term) ||
                a.Content.Contains(term) ||
                a.Writer.Contains(term) ||
                a.Email.Contains(term));
        }

        return query;
    }

    private static IQueryable<Article> ApplySort(IQueryable<Article> query, string? sort)
    {
        // 우선순위: 상단고정(2점) + 공지 카테고리(1점)
        var priorityQuery = query.OrderByDescending(a =>
            (a.IsPinned ? 2 : 0) +
            (a.Category == "notice" ? 1 : 0));

        return sort switch
        {
            "oldest" => priorityQuery.ThenBy(a => a.CreatedAt).ThenBy(a => a.Id),
            "-views" => priorityQuery.ThenByDescending(a => a.Views).ThenByDescending(a => a.CreatedAt).ThenByDescending(a => a.Id),
            "+views" => priorityQuery.ThenBy(a => a.Views).ThenByDescending(a => a.CreatedAt).ThenByDescending(a => a.Id),
            _ => priorityQuery.ThenByDescending(a => a.CreatedAt).ThenByDescending(a => a.Id),
        };
    }
}
