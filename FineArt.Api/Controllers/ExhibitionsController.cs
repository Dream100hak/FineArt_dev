using FineArt.Api.Contracts;
using FineArt.Application.Exhibitions;
using FineArt.Domain;
using FineArt.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FineArt.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExhibitionsController : ControllerBase
{
    private readonly AppDb _db;
    private readonly ExhibitionQueryService _queryService;
    private readonly ExhibitionCommandService _commandService;

    public ExhibitionsController(
        AppDb db,
        ExhibitionQueryService queryService,
        ExhibitionCommandService commandService)
    {
        _db = db;
        _queryService = queryService;
        _commandService = commandService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(
        [FromQuery] ExhibitionListQuery query,
        CancellationToken cancellationToken = default)
    {
        var page = query.Page < 1 ? 1 : query.Page;
        var size = query.Size < 1 ? 9 : query.Size;

        var source = _db.Exhibitions.AsNoTracking();
        var (items, total) = await _queryService.QueryAsync(
            source,
            query.Category,
            query.Keyword,
            page,
            size,
            cancellationToken);

        var responseItems = items.Select(MapToResponse);

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
        var exhibition = await _queryService.GetByIdAsync(
            _db.Exhibitions.AsNoTracking(),
            id,
            cancellationToken);

        if (exhibition is null)
        {
            return NotFound(new { message = "Exhibition not found." });
        }

        return Ok(MapToResponse(exhibition));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(
        [FromBody] ExhibitionCreateRequest request,
        CancellationToken cancellationToken = default)
    {
        var validationError = ValidatePayload(
            request.Title,
            request.Description,
            request.Artist,
            request.Host,
            request.Participants,
            request.Location,
            request.StartDate,
            request.EndDate,
            request.Category);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var exhibition = await _commandService.CreateAsync(
            request.Title,
            request.Description,
            request.Artist,
            request.Host,
            request.Participants,
            request.StartDate,
            request.EndDate,
            request.ImageUrl,
            request.Location,
            request.Category,
            cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = exhibition.Id }, MapToResponse(exhibition));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] ExhibitionUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        var validationError = ValidatePayload(
            request.Title,
            request.Description,
            request.Artist,
            request.Host,
            request.Participants,
            request.Location,
            request.StartDate,
            request.EndDate,
            request.Category);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var exhibition = await _commandService.UpdateAsync(
            id,
            request.Title,
            request.Description,
            request.Artist,
            request.Host,
            request.Participants,
            request.StartDate,
            request.EndDate,
            request.ImageUrl,
            request.Location,
            request.Category,
            cancellationToken);

        if (exhibition is null)
        {
            return NotFound(new { message = "Exhibition not found." });
        }

        return Ok(MapToResponse(exhibition));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var deleted = await _commandService.DeleteAsync(id, cancellationToken);
        if (!deleted)
        {
            return NotFound(new { message = "Exhibition not found." });
        }

        return NoContent();
    }

    private static object MapToResponse(Exhibition exhibition) => new
    {
        id = exhibition.Id,
        exhibition.Title,
        exhibition.Description,
        exhibition.Artist,
        exhibition.Host,
        exhibition.Participants,
        exhibition.Location,
        exhibition.ImageUrl,
        exhibition.StartDate,
        exhibition.EndDate,
        Category = exhibition.Category.ToString().ToLowerInvariant(),
        exhibition.CreatedAt
    };

    private static string? ValidatePayload(
        string title,
        string description,
        string artist,
        string? host,
        string? participants,
        string location,
        DateTime startDate,
        DateTime endDate,
        string category)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            return "Title is required.";
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            return "Description is required.";
        }

        if (string.IsNullOrWhiteSpace(artist))
        {
            return "Artist is required.";
        }

        if (host is not null && host.Length > 255)
        {
            return "Host must be 255 characters or fewer.";
        }

        if (participants is not null && participants.Length > 2000)
        {
            return "Participants must be 2000 characters or fewer.";
        }

        if (string.IsNullOrWhiteSpace(location))
        {
            return "Location is required.";
        }

        if (endDate < startDate)
        {
            return "EndDate must be greater than or equal to StartDate.";
        }

        if (string.IsNullOrWhiteSpace(category))
        {
            return "Category is required.";
        }

        if (!Enum.TryParse<ExhibitionCategory>(category.Trim(), ignoreCase: true, out _))
        {
            return "Category must be one of solo, group, digital, installation.";
        }

        return null;
    }
}
