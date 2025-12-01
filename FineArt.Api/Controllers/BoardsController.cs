using System.Collections.Generic;
using System.Linq;
using FineArt.Api.Contracts;
using FineArt.Application.Articles;
using FineArt.Application.BoardTypes;
using FineArt.Domain;
using FineArt.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FineArt.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BoardsController : ControllerBase
{
    private readonly AppDb _db;
    private readonly BoardTypeQueryService _boardTypeQueryService;
    private readonly BoardTypeCommandService _boardTypeCommandService;
    private readonly ArticleQueryService _articleQueryService;

    public BoardsController(
        AppDb db,
        BoardTypeQueryService boardTypeQueryService,
        BoardTypeCommandService boardTypeCommandService,
        ArticleQueryService articleQueryService)
    {
        _db = db;
        _boardTypeQueryService = boardTypeQueryService;
        _boardTypeCommandService = boardTypeCommandService;
        _articleQueryService = articleQueryService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(
        [FromQuery] BoardListQuery query,
        CancellationToken cancellationToken = default)
    {
        var page = query.Page < 1 ? 1 : query.Page;
        var size = query.Size < 1 ? 10 : query.Size;

        var source = _db.BoardTypes.AsNoTracking();
        var (items, total) = await _boardTypeQueryService.QueryAsync(
            source,
            query.Keyword,
            query.Sort,
            page,
            size,
            query.IncludeHidden,
            cancellationToken);

        var articleCounts = await LoadArticleCountsAsync(items.Select(b => b.Id).ToArray(), cancellationToken);
        var responseItems = items.Select(b => MapBoardResponse(b, articleCounts));

        return Ok(new
        {
            total,
            page,
            size,
            items = responseItems
        });
    }

    [HttpGet("sidebar")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSidebar(
        [FromQuery] bool includeHidden = false,
        CancellationToken cancellationToken = default)
    {
        var boards = await _db.BoardTypes.AsNoTracking()
            .Where(b => includeHidden || b.IsVisible)
            .OrderBy(b => b.OrderIndex)
            .ThenBy(b => b.Name)
            .ToListAsync(cancellationToken);

        var counts = await LoadArticleCountsAsync(boards.Select(b => b.Id).ToArray(), cancellationToken);
        var tree = BuildBoardTree(boards, counts);

        return Ok(new { items = tree });
    }

    [HttpGet("{slugOrId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBySlugOrId(string slugOrId, CancellationToken cancellationToken = default)
    {
        var board = await ResolveBoardAsync(slugOrId, cancellationToken);
        if (board is null)
        {
            return NotFound(new { message = "Board not found." });
        }

        var articleCounts = await LoadArticleCountsAsync(new[] { board.Id }, cancellationToken);
        return Ok(MapBoardResponse(board, articleCounts));
    }

    [HttpGet("{slug}/articles")]
    [AllowAnonymous]
    public async Task<IActionResult> GetArticlesByBoard(
        string slug,
        [FromQuery] ArticleListQuery query,
        CancellationToken cancellationToken = default)
    {
        var board = await _db.BoardTypes.AsNoTracking()
            .FirstOrDefaultAsync(b => b.Slug == slug, cancellationToken);

        if (board is null)
        {
            return NotFound(new { message = "Board not found." });
        }

        var page = query.Page < 1 ? 1 : query.Page;
        var size = query.Size < 1 ? 10 : query.Size;
        var sort = string.IsNullOrWhiteSpace(query.Sort) ? "-created" : query.Sort;

        var source = _db.Articles
            .AsNoTracking()
            .Include(a => a.BoardType)
            .Where(a => a.BoardTypeId == board.Id);
        var (items, total) = await _articleQueryService.QueryAsync(
            source,
            board.Id,
            board.Slug,
            query.Category,
            query.Keyword,
            sort,
            page,
            size,
            cancellationToken);

        var responseItems = items.Select(MapArticleResponse);

        return Ok(new
        {
            board = MapBoardResponse(board),
            total,
            page,
            size,
            items = responseItems
        });
    }

    [HttpGet("{slug}/articles/{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetArticleByBoardAndId(
        string slug,
        int id,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(slug))
        {
            return NotFound(new { message = "Board not found." });
        }

        var normalizedSlug = slug.Trim().ToLowerInvariant();
        var article = await _db.Articles
            .Include(a => a.BoardType)
            .FirstOrDefaultAsync(
                a => a.Id == id && a.BoardType.Slug.ToLower() == normalizedSlug,
                cancellationToken);

        if (article is null)
        {
            return NotFound(new { message = "Article not found." });
        }

        article.Views += 1;
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(MapArticleResponse(article));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(
        [FromBody] BoardCreateRequest request,
        CancellationToken cancellationToken = default)
    {
        var validationError = ValidateBoardPayload(request.Name, request.OrderIndex);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        if (!TryParseLayoutType(request.LayoutType, out var layoutType, out var layoutError))
        {
            return BadRequest(new { message = layoutError });
        }

        var parentError = await ValidateParentAsync(request.ParentId, null, cancellationToken);
        if (parentError is not null)
        {
            return BadRequest(new { message = parentError });
        }

        var board = await _boardTypeCommandService.CreateAsync(
            request.Name,
            request.Slug,
            request.Description,
            layoutType,
            request.OrderIndex,
            request.ParentId,
            request.IsVisible,
            cancellationToken);

        return CreatedAtAction(nameof(GetBySlugOrId), new { slugOrId = board.Slug }, MapBoardResponse(board));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] BoardUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        var validationError = ValidateBoardPayload(request.Name, request.OrderIndex);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        if (!TryParseLayoutType(request.LayoutType, out var layoutType, out var layoutError))
        {
            return BadRequest(new { message = layoutError });
        }

        var parentError = await ValidateParentAsync(request.ParentId, id, cancellationToken);
        if (parentError is not null)
        {
            return BadRequest(new { message = parentError });
        }

        var board = await _boardTypeCommandService.UpdateAsync(
            id,
            request.Name,
            request.Slug,
            request.Description,
            layoutType,
            request.OrderIndex,
            request.ParentId,
            request.IsVisible,
            cancellationToken);

        if (board is null)
        {
            return NotFound(new { message = "Board not found." });
        }

        return Ok(MapBoardResponse(board));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var deleted = await _boardTypeCommandService.DeleteAsync(id, cancellationToken);
        if (!deleted)
        {
            return NotFound(new { message = "Board not found." });
        }

        return NoContent();
    }

    private static string? ValidateBoardPayload(string? name, int orderIndex)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return "Name is required.";
        }

        if (orderIndex < 0)
        {
            return "OrderIndex must be zero or greater.";
        }

        return null;
    }

    private static BoardLayoutType NormalizeLayout(BoardLayoutType layout) =>
        layout == BoardLayoutType.Table ? BoardLayoutType.List : layout;

    private static object MapBoardResponse(BoardType board, IReadOnlyDictionary<int, int>? counts = null)
    {
        counts ??= new Dictionary<int, int>();
        counts.TryGetValue(board.Id, out var articleCount);
        var effectiveLayout = NormalizeLayout(board.LayoutType);
        return new
        {
            id = board.Id,
            board.Name,
            board.Slug,
            board.Description,
            layoutType = effectiveLayout.ToString().ToLowerInvariant(),
            board.OrderIndex,
            board.ParentId,
            board.IsVisible,
            board.CreatedAt,
            board.UpdatedAt,
            articleCount
        };
    }

    private async Task<BoardType?> ResolveBoardAsync(string slugOrId, CancellationToken cancellationToken)
    {
        if (int.TryParse(slugOrId, out var id))
        {
            return await _db.BoardTypes.AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
        }

        if (string.IsNullOrWhiteSpace(slugOrId))
        {
            return null;
        }

        var normalized = slugOrId.Trim().ToLowerInvariant();
        return await _db.BoardTypes.AsNoTracking()
            .FirstOrDefaultAsync(b => b.Slug.ToLower() == normalized, cancellationToken);
    }

    private static bool TryParseLayoutType(
        string? layoutValue,
        out BoardLayoutType layoutType,
        out string? error)
    {
        if (string.IsNullOrWhiteSpace(layoutValue))
        {
            layoutType = BoardLayoutType.List;
            error = null;
            return true;
        }

        if (Enum.TryParse(layoutValue, true, out layoutType))
        {
            layoutType = NormalizeLayout(layoutType);
            error = null;
            return true;
        }

        layoutType = BoardLayoutType.List;
        error = "Invalid layout type.";
        return false;
    }

    private async Task<string?> ValidateParentAsync(
        int? parentId,
        int? currentId,
        CancellationToken cancellationToken)
    {
        if (!parentId.HasValue)
        {
            return null;
        }

        if (currentId.HasValue && parentId.Value == currentId.Value)
        {
            return "ParentId cannot match the board id.";
        }

        var exists = await _db.BoardTypes.AsNoTracking()
            .AnyAsync(b => b.Id == parentId.Value, cancellationToken);

        return exists ? null : "Parent board not found.";
    }

    private async Task<IReadOnlyDictionary<int, int>> LoadArticleCountsAsync(
        IReadOnlyCollection<int> boardIds,
        CancellationToken cancellationToken)
    {
        if (boardIds.Count == 0)
        {
            return new Dictionary<int, int>();
        }

        var ids = boardIds.ToArray();
        var counts = await _db.Articles.AsNoTracking()
            .Where(a => ids.Contains(a.BoardTypeId))
            .GroupBy(a => a.BoardTypeId)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(g => g.Key, g => g.Count, cancellationToken);

        return counts;
    }

    private static IReadOnlyList<object> BuildBoardTree(
        IReadOnlyList<BoardType> boards,
        IReadOnlyDictionary<int, int> counts)
    {
        var lookup = boards.ToLookup(b => b.ParentId, b => b);

        List<object> Build(int? parentId)
        {
            var children = lookup[parentId]
                .OrderBy(b => b.OrderIndex)
               .ThenBy(b => b.Name)
                .ToList();

            if (children.Count == 0)
            {
                return new List<object>();
            }

            return children.Select(child => new
            {
                id = child.Id,
                child.Name,
                child.Slug,
                child.Description,
                layoutType = NormalizeLayout(child.LayoutType).ToString().ToLowerInvariant(),
                child.OrderIndex,
                child.ParentId,
                child.IsVisible,
                articleCount = counts.TryGetValue(child.Id, out var value) ? value : 0,
                children = Build(child.Id)
            }).Cast<object>().ToList();
        }

        return Build(null);
    }

    private static object MapArticleResponse(FineArt.Domain.Article article) => new
    {
        id = article.Id,
        Board = new { id = article.BoardTypeId, article.BoardType?.Name, article.BoardType?.Slug },
        article.Title,
        article.Content,
        Author = article.Writer,
        Writer = article.Writer,
        article.Email,
        article.Category,
        article.Views,
        article.IsPinned,
        article.ImageUrl,
        article.ThumbnailUrl,
        article.CreatedAt,
        article.UpdatedAt
    };
}
