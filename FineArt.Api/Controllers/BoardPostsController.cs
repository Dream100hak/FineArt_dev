using FineArt.Api.Contracts;
using FineArt.Application.Articles;
using FineArt.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FineArt.Api.Controllers;

[ApiController]
[Route("api/board-posts")]
public class BoardPostsController : ControllerBase
{
    private const string LegacyBoardSlug = "free";
    private readonly AppDb _db;
    private readonly ArticleQueryService _articleQueryService;
    private readonly ArticleCommandService _articleCommandService;

    public BoardPostsController(
        AppDb db,
        ArticleQueryService articleQueryService,
        ArticleCommandService articleCommandService)
    {
        _db = db;
        _articleQueryService = articleQueryService;
        _articleCommandService = articleCommandService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(
        [FromQuery] BoardPostListQuery query,
        CancellationToken cancellationToken = default)
    {
        var page = query.Page < 1 ? 1 : query.Page;
        var size = query.Size < 1 ? 10 : query.Size;

        var legacyBoardId = await ResolveLegacyBoardIdAsync(cancellationToken);
        if (legacyBoardId is null)
        {
            return StatusCode(StatusCodes.Status410Gone, new { message = "Legacy board has been removed." });
        }

        var source = _db.Articles
            .AsNoTracking()
            .Where(a => a.BoardTypeId == legacyBoardId.Value);
        var (items, total) = await _articleQueryService.QueryAsync(
            source,
            legacyBoardId,
            LegacyBoardSlug,
            query.Category,
            query.Keyword,
            query.Sort,
            page,
            size,
            cancellationToken);

        var responseItems = items.Select(MapToResponse).ToList();
        return Ok(new
        {
            total,
            page,
            size,
            items = responseItems,
            responseItems
        });
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var post = await _articleCommandService.IncrementViewCountAsync(id, cancellationToken);
        if (post is null)
        {
            return NotFound(new { message = "Board post not found." });
        }

        return Ok(MapToResponse(post));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(
        [FromBody] BoardPostCreateRequest request,
        CancellationToken cancellationToken = default)
    {
        var legacyBoardId = await ResolveLegacyBoardIdAsync(cancellationToken);
        if (legacyBoardId is null)
        {
            return StatusCode(StatusCodes.Status410Gone, new { message = "Legacy board has been removed." });
        }

        var validationError = ValidatePayload(request.Title, request.Content, request.Category, request.Author, request.Email);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var post = await _articleCommandService.CreateAsync(
            legacyBoardId.Value,
            request.Title,
            request.Content,
            request.Author,
            request.Email,
            request.Category,
            null,
            null,
            false,
            cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = post.Id }, MapToResponse(post));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] BoardPostUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        var legacyBoardId = await ResolveLegacyBoardIdAsync(cancellationToken);
        if (legacyBoardId is null)
        {
            return StatusCode(StatusCodes.Status410Gone, new { message = "Legacy board has been removed." });
        }

        var validationError = ValidatePayload(request.Title, request.Content, request.Category, request.Author, request.Email);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var post = await _articleCommandService.UpdateAsync(
            id,
            legacyBoardId.Value,
            request.Title,
            request.Content,
            request.Author,
            request.Email,
            request.Category,
            null,
            null,
            false,
            cancellationToken);

        if (post is null)
        {
            return NotFound(new { message = "Board post not found." });
        }

        return Ok(MapToResponse(post));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var deleted = await _articleCommandService.DeleteAsync(id, cancellationToken);
        if (!deleted)
        {
            return NotFound(new { message = "Board post not found." });
        }

        return NoContent();
    }

    private static object MapToResponse(FineArt.Domain.Article post) => new
    {
        id = post.Id,
        post.Title,
        post.Content,
        post.Category,
        Author = post.Writer,
        post.Email,
        post.Views,
        post.CreatedAt,
        post.UpdatedAt
    };

    private static string? ValidatePayload(string title, string content, string category, string author, string email)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            return "Title is required.";
        }

        if (string.IsNullOrWhiteSpace(content))
        {
            return "Content is required.";
        }

        if (string.IsNullOrWhiteSpace(category))
        {
            return "Category is required.";
        }

        if (string.IsNullOrWhiteSpace(author))
        {
            return "Author is required.";
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            return "Email is required.";
        }

        return null;
    }

    private async Task<int?> ResolveLegacyBoardIdAsync(CancellationToken cancellationToken)
    {
        var board = await _db.BoardTypes
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Slug == LegacyBoardSlug, cancellationToken);

        return board?.Id;
    }
}
