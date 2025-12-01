using System;
using System.Text;
using FineArt.Domain;
using Microsoft.EntityFrameworkCore;

namespace FineArt.Application.BoardTypes;

public class BoardTypeCommandService
{
    private readonly DbContext _db;
    private readonly DbSet<BoardType> _boardTypes;

    public BoardTypeCommandService(DbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _boardTypes = _db.Set<BoardType>();
    }

    public async Task<BoardType> CreateAsync(
        string name,
        string? slug,
        string? description,
        BoardLayoutType layoutType,
        int orderIndex,
        int? parentId,
        bool isVisible,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Name is required.", nameof(name));
        }

        var normalizedName = name.Trim();
        var normalizedDescription = NormalizeDescription(description);
        var normalizedSlug = await GenerateUniqueSlugAsync(slug, normalizedName, null, cancellationToken);
        var now = DateTime.UtcNow;

        var board = new BoardType
        {
            Name = normalizedName,
            Slug = normalizedSlug,
            Description = normalizedDescription,
            LayoutType = layoutType,
            OrderIndex = orderIndex,
            ParentId = parentId,
            IsVisible = isVisible,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _boardTypes.AddAsync(board, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        return board;
    }

    public async Task<BoardType?> UpdateAsync(
        int id,
        string name,
        string? slug,
        string? description,
        BoardLayoutType layoutType,
        int orderIndex,
        int? parentId,
        bool isVisible,
        CancellationToken cancellationToken = default)
    {
        var board = await _boardTypes.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
        if (board is null)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(name))
        {
            board.Name = name.Trim();
        }

        if (description is not null)
        {
            board.Description = NormalizeDescription(description);
        }
        var slugSource = string.IsNullOrWhiteSpace(slug) ? board.Slug : slug;
        board.Slug = await GenerateUniqueSlugAsync(slugSource, board.Name, id, cancellationToken);
        board.LayoutType = layoutType;
        board.OrderIndex = orderIndex;
        board.ParentId = parentId;
        board.IsVisible = isVisible;
        board.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return board;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var board = await _boardTypes.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
        if (board is null)
        {
            return false;
        }

        _boardTypes.Remove(board);
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static string? NormalizeDescription(string? description) =>
        string.IsNullOrWhiteSpace(description) ? null : description.Trim();

    private async Task<string> GenerateUniqueSlugAsync(
        string? slugCandidate,
        string fallback,
        int? excludeId,
        CancellationToken cancellationToken)
    {
        var baseValue = string.IsNullOrWhiteSpace(slugCandidate) ? fallback : slugCandidate;
        var normalized = Slugify(baseValue);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            normalized = Guid.NewGuid().ToString("n").Substring(0, 8);
        }

        var current = normalized;
        var suffix = 2;
        while (await _boardTypes.AnyAsync(
                   b => b.Slug == current && (!excludeId.HasValue || b.Id != excludeId.Value),
                   cancellationToken))
        {
            current = $"{normalized}-{suffix++}";
        }

        return current;
    }

    private static string Slugify(string value)
    {
        var builder = new StringBuilder(value.Length);
        var previousDash = false;

        foreach (var ch in value.Trim())
        {
            if (char.IsLetterOrDigit(ch))
            {
                builder.Append(char.ToLowerInvariant(ch));
                previousDash = false;
                continue;
            }

            if (char.IsWhiteSpace(ch) || ch is '-' or '_')
            {
                if (!previousDash)
                {
                    builder.Append('-');
                    previousDash = true;
                }
            }
        }

        var result = builder.ToString().Trim('-');
        return string.IsNullOrWhiteSpace(result) ? string.Empty : result;
    }
}
