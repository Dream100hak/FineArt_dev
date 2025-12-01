using FineArt.Domain;
using Microsoft.EntityFrameworkCore;

namespace FineArt.Application.Articles;

public class ArticleCommandService
{
    private readonly DbContext _db;
    private readonly DbSet<Article> _articles;

    public ArticleCommandService(DbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _articles = _db.Set<Article>();
    }

    public async Task<Article> CreateAsync(
        int boardTypeId,
        string title,
        string content,
        string writer,
        string email,
        string? category,
        string? imageUrl,
        string? thumbnailUrl,
        bool isPinned,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var article = new Article
        {
            BoardTypeId = boardTypeId,
            Title = title.Trim(),
            Content = content.Trim(),
            Writer = writer.Trim(),
            Email = email.Trim(),
            Category = NormalizeCategory(category),
            ImageUrl = imageUrl?.Trim(),
            ThumbnailUrl = thumbnailUrl?.Trim(),
            Views = 0,
            IsPinned = isPinned,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _articles.AddAsync(article, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
        await EnsureBoardLoadedAsync(article, cancellationToken);

        return article;
    }

    public async Task<Article?> UpdateAsync(
        int id,
        int boardTypeId,
        string title,
        string content,
        string writer,
        string email,
        string? category,
        string? imageUrl,
        string? thumbnailUrl,
        bool isPinned,
        CancellationToken cancellationToken = default)
    {
        var article = await _articles.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (article is null)
        {
            return null;
        }

        article.BoardTypeId = boardTypeId;
        article.Title = title.Trim();
        article.Content = content.Trim();
        article.Writer = writer.Trim();
        article.Email = email.Trim();
        article.Category = NormalizeCategory(category);
        article.ImageUrl = imageUrl?.Trim();
        article.ThumbnailUrl = thumbnailUrl?.Trim();
        article.IsPinned = isPinned;
        article.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        await EnsureBoardLoadedAsync(article, cancellationToken);

        return article;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var article = await _articles.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (article is null)
        {
            return false;
        }

        _articles.Remove(article);
        await _db.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<Article?> IncrementViewCountAsync(int id, CancellationToken cancellationToken = default)
    {
        var article = await _articles
            .Include(a => a.BoardType)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (article is null)
        {
            return null;
        }

        article.Views += 1;
        await _db.SaveChangesAsync(cancellationToken);

        return article;
    }

    private static string? NormalizeCategory(string? category) =>
        string.IsNullOrWhiteSpace(category)
            ? null
            : category.Trim().ToLowerInvariant();

    private async Task EnsureBoardLoadedAsync(Article article, CancellationToken cancellationToken)
    {
        if (article is null)
        {
            return;
        }

        var entry = _db.Entry(article);
        if (entry.Reference(a => a.BoardType).IsLoaded)
        {
            return;
        }

        await entry.Reference(a => a.BoardType).LoadAsync(cancellationToken);
    }
}
