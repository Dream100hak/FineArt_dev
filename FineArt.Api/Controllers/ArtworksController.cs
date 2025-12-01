using System.Linq;
using FineArt.Api.Contracts;
using FineArt.Application.Artworks;
using FineArt.Domain;
using FineArt.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FineArt.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ArtworksController : ControllerBase
{
    private readonly AppDb _db;
    private readonly ArtworkQueryService _artworkQueryService;
    private readonly ArtworkCommandService _artworkCommandService;

    public ArtworksController(
        AppDb db,
        ArtworkQueryService artworkQueryService,
        ArtworkCommandService artworkCommandService)
    {
        _db = db;
        _artworkQueryService = artworkQueryService;
        _artworkCommandService = artworkCommandService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? keyword,
        [FromQuery] string? theme,
        [FromQuery] int? priceMin,
        [FromQuery] int? priceMax,
        [FromQuery(Name = "size")] string? sizeFilter,
        [FromQuery] string? material,
        [FromQuery] bool? rentable,
        [FromQuery] string? status,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery(Name = "pageSize")] int pageSize = 12,
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

        var source = _db.Artworks
            .AsNoTracking()
            .Include(a => a.Artist);

        var (items, total) = await _artworkQueryService.QueryAsync(
            source,
            keyword,
            theme,
            sizeFilter,
            material,
            rentable,
            priceMin,
            priceMax,
            status,
            sort,
            page,
            pageSize,
            cancellationToken);

        var responseItems = items.Select(a => new
        {
            a.Id,
            a.Title,
            a.ArtistDisplayName,
            a.Price,
            a.ImageUrl,
            Status = a.Status.ToString(),
            a.ArtistId,
            ArtistName = a.Artist?.Name ?? string.Empty,
            a.MainTheme,
            a.SubTheme,
            a.Size,
            a.WidthCm,
            a.HeightCm,
            a.SizeBucket,
            a.Material,
            a.IsRentable,
            a.RentPrice,
            a.CreatedAt,
            a.UpdatedAt
        });

        return Ok(new
        {
            total,
            page,
            pageSize,
            items = responseItems
        });
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var artwork = await _db.Artworks
            .AsNoTracking()
            .Where(a => a.Id == id)
            .Select(a => new
            {
                a.Id,
                a.Title,
                a.Price,
                a.ImageUrl,
                Status = a.Status.ToString(),
                a.ArtistId,
                ArtistName = a.Artist != null ? a.Artist.Name : string.Empty,
                a.ArtistDisplayName,
                a.Description,
                a.MainTheme,
            a.SubTheme,
            a.Size,
            a.WidthCm,
            a.HeightCm,
            a.SizeBucket,
            a.Material,
            a.IsRentable,
            a.RentPrice,
            a.CreatedAt,
            a.UpdatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);

        return artwork is null
            ? NotFound(new { message = "Artwork not found." })
            : Ok(artwork);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] ArtworkCreateDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) ||
            string.IsNullOrWhiteSpace(dto.Description) ||
            string.IsNullOrWhiteSpace(dto.MainTheme) ||
            string.IsNullOrWhiteSpace(dto.Size) ||
            string.IsNullOrWhiteSpace(dto.Material) ||
            dto.Price < 0 ||
            dto.ArtistId <= 0)
        {
            return BadRequest(new { message = "Title, description, price, material, size, and artist must be valid." });
        }

        if (dto.IsRentable && (!dto.RentPrice.HasValue || dto.RentPrice <= 0))
        {
            return BadRequest(new { message = "Rent price must be provided for rentable artworks." });
        }

        if (!Enum.TryParse<ArtworkStatus>(dto.Status, true, out var status))
        {
            return BadRequest(new { message = "Artwork status is not valid." });
        }

        var normalizedSize = dto.Size?.Trim() ?? string.Empty;
        var normalizedSizeBucket = dto.SizeBucket?.Trim();

        var artist = await _db.Artists
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == dto.ArtistId, cancellationToken);
        if (artist is null)
        {
            return BadRequest(new { message = "Artist not found." });
        }

        var artwork = await _artworkCommandService.CreateAsync(
            dto.Title,
            artist.Name,
            dto.Description,
            dto.MainTheme,
            dto.SubTheme,
            normalizedSize,
            dto.WidthCm,
            dto.HeightCm,
            normalizedSizeBucket,
            dto.Material,
            dto.Price,
            dto.IsRentable,
            dto.RentPrice,
            dto.ImageUrl,
            status,
            dto.ArtistId,
            cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = artwork.Id }, new
        {
            artwork.Id,
            artwork.Title,
            artwork.ArtistDisplayName,
            artwork.Price,
            artwork.ImageUrl,
            Status = artwork.Status.ToString(),
            artwork.ArtistId,
            ArtistName = artist.Name,
            artwork.MainTheme,
            artwork.SubTheme,
            artwork.Size,
            artwork.WidthCm,
            artwork.HeightCm,
            artwork.SizeBucket,
            artwork.Material,
            artwork.IsRentable,
            artwork.RentPrice,
            artwork.CreatedAt,
            artwork.UpdatedAt
        });
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] ArtworkUpdateDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) ||
            string.IsNullOrWhiteSpace(dto.Description) ||
            string.IsNullOrWhiteSpace(dto.MainTheme) ||
            string.IsNullOrWhiteSpace(dto.Size) ||
            string.IsNullOrWhiteSpace(dto.Material) ||
            dto.Price < 0 ||
            dto.ArtistId <= 0)
        {
            return BadRequest(new { message = "Title, description, price, material, size, and artist must be valid." });
        }

        if (dto.IsRentable && (!dto.RentPrice.HasValue || dto.RentPrice <= 0))
        {
            return BadRequest(new { message = "Rent price must be provided for rentable artworks." });
        }

        if (!Enum.TryParse<ArtworkStatus>(dto.Status, true, out var status))
        {
            return BadRequest(new { message = "Artwork status is not valid." });
        }

        var normalizedSize = dto.Size?.Trim() ?? string.Empty;
        var normalizedSizeBucket = dto.SizeBucket?.Trim();

        var artist = await _db.Artists
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == dto.ArtistId, cancellationToken);
        if (artist is null)
        {
            return BadRequest(new { message = "Artist not found." });
        }

        var artwork = await _artworkCommandService.UpdateAsync(
            id,
            dto.Title,
            artist.Name,
            dto.Description,
            dto.MainTheme,
            dto.SubTheme,
            normalizedSize,
            dto.WidthCm,
            dto.HeightCm,
            normalizedSizeBucket,
            dto.Material,
            dto.Price,
            dto.IsRentable,
            dto.RentPrice,
            dto.ImageUrl,
            status,
            dto.ArtistId,
            cancellationToken);

        if (artwork is null)
        {
            return NotFound(new { message = "Artwork not found." });
        }

        return Ok(new
        {
            artwork.Id,
            artwork.Title,
            artwork.ArtistDisplayName,
            artwork.Price,
            artwork.ImageUrl,
            Status = artwork.Status.ToString(),
            artwork.ArtistId,
            ArtistName = artist.Name,
            artwork.MainTheme,
            artwork.SubTheme,
            artwork.Size,
            artwork.WidthCm,
            artwork.HeightCm,
            artwork.SizeBucket,
            artwork.Material,
            artwork.IsRentable,
            artwork.RentPrice,
            artwork.CreatedAt,
            artwork.UpdatedAt
        });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var deleted = await _artworkCommandService.DeleteAsync(id, cancellationToken);
        if (!deleted)
        {
            return NotFound(new { message = "Artwork not found." });
        }

        return NoContent();
    }
}
