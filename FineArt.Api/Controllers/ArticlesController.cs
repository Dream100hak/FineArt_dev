using System;
using System.Collections.Generic;
using System.Linq;
using FineArt.Api.Contracts;
using FineArt.Application.Articles;
using FineArt.Domain;
using FineArt.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FineArt.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ArticlesController : ControllerBase
{
    private readonly AppDb _db;
    private readonly ArticleQueryService _articleQueryService;
    private readonly ArticleCommandService _articleCommandService;

    public ArticlesController(
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
        [FromQuery] ArticleListQuery query,
        CancellationToken cancellationToken = default)
    {
        var page = query.Page < 1 ? 1 : query.Page;
        var size = query.Size < 1 ? 10 : query.Size;
        var sort = string.IsNullOrWhiteSpace(query.Sort) ? "-created" : query.Sort;

        var source = _db.Articles
            .AsNoTracking()
            .Include(a => a.BoardType);
        var (items, total) = await _articleQueryService.QueryAsync(
            source,
            query.BoardTypeId,
            query.BoardSlug,
            query.Category,
            query.Keyword,
            sort,
            page,
            size,
            cancellationToken);

        var responseItems = items.Select(MapArticleResponse);

        return Ok(new
        {
            total,
            page,
            size,
            items = responseItems
        });
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var article = await _articleCommandService.IncrementViewCountAsync(id, cancellationToken);
        if (article is null)
        {
            return NotFound(new { message = "Article not found." });
        }

        return Ok(MapArticleResponse(article));
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create(
        [FromBody] ArticleCreateRequest request,
        CancellationToken cancellationToken = default)
    {
        var validationError = ValidateArticlePayload(
            request.BoardTypeId,
            request.Title,
            request.Content,
            request.Writer,
            request.Email,
            request.Category);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var boardExists = await _db.BoardTypes.AsNoTracking()
            .AnyAsync(b => b.Id == request.BoardTypeId, cancellationToken);
        if (!boardExists)
        {
            return BadRequest(new { message = "BoardTypeId does not exist." });
        }

        var canPin = User?.IsInRole("Admin") == true;
        var article = await _articleCommandService.CreateAsync(
            request.BoardTypeId,
            request.Title,
            request.Content,
            request.Writer,
            request.Email,
            request.Category,
            request.ImageUrl,
            request.ThumbnailUrl,
            canPin && request.IsPinned,
            cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = article.Id }, MapArticleResponse(article));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] ArticleUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        var validationError = ValidateArticlePayload(
            request.BoardTypeId,
            request.Title,
            request.Content,
            request.Writer,
            request.Email,
            request.Category);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var boardExists = await _db.BoardTypes.AsNoTracking()
            .AnyAsync(b => b.Id == request.BoardTypeId, cancellationToken);
        if (!boardExists)
        {
            return BadRequest(new { message = "BoardTypeId does not exist." });
        }

        var article = await _articleCommandService.UpdateAsync(
            id,
            request.BoardTypeId,
            request.Title,
            request.Content,
            request.Writer,
            request.Email,
            request.Category,
            request.ImageUrl,
            request.ThumbnailUrl,
            request.IsPinned,
            cancellationToken);

        if (article is null)
        {
            return NotFound(new { message = "Article not found." });
        }

        return Ok(MapArticleResponse(article));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var deleted = await _articleCommandService.DeleteAsync(id, cancellationToken);
        if (!deleted)
        {
            return NotFound(new { message = "Article not found." });
        }

        return NoContent();
    }

    private static object MapArticleResponse(Article article) => new
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
        Images = BuildImageSet(article.ImageUrl, article.ThumbnailUrl),
        article.CreatedAt,
        article.UpdatedAt
    };

    private static IReadOnlyList<string> BuildImageSet(string? imageUrl, string? thumbnailUrl)
    {
        var images = new List<string>(capacity: 2);
        if (!string.IsNullOrWhiteSpace(imageUrl))
        {
            images.Add(imageUrl);
        }

        if (!string.IsNullOrWhiteSpace(thumbnailUrl) &&
            !string.Equals(thumbnailUrl, imageUrl, StringComparison.OrdinalIgnoreCase))
        {
            images.Add(thumbnailUrl);
        }

        return images;
    }

    private static string? ValidateArticlePayload(
        int boardTypeId,
        string title,
        string content,
        string writer,
        string email,
        string? category)
    {
        if (boardTypeId <= 0)
        {
            return "BoardTypeId is required.";
        }

        if (string.IsNullOrWhiteSpace(title))
        {
            return "Title is required.";
        }

        if (string.IsNullOrWhiteSpace(content))
        {
            return "Content is required.";
        }

        if (string.IsNullOrWhiteSpace(writer))
        {
            return "Writer is required.";
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            return "Email is required.";
        }

        return null;
    }
}
