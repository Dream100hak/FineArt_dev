using System.Linq;
using FineArt.Api.Contracts;
using FineArt.Domain;
using FineArt.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FineArt.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ArtistsController : ControllerBase
{
    private readonly AppDb _db;

    public ArtistsController(AppDb db)
    {
        _db = db;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var artists = await _db.Artists
            .AsNoTracking()
            .OrderByDescending(a => a.Id)
            .Select(a => new
            {
                a.Id,
                a.Name,
                a.Bio,
                a.Nationality,
                a.ImageUrl,
                a.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(artists);
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var artist = await _db.Artists
            .AsNoTracking()
            .Where(a => a.Id == id)
            .Select(a => new
            {
                a.Id,
                a.Name,
                a.Bio,
                a.Nationality,
                a.ImageUrl,
                a.CreatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);

        return artist is null
            ? NotFound(new { message = "Artist not found." })
            : Ok(artist);
    }

    [HttpGet("{id:int}/artworks")]
    [AllowAnonymous]
    public async Task<IActionResult> GetArtworksByArtist(int id, CancellationToken cancellationToken)
    {
        var artist = await _db.Artists
            .AsNoTracking()
            .Where(a => a.Id == id)
            .Select(a => new { a.Id, a.Name })
            .FirstOrDefaultAsync(cancellationToken);

        if (artist is null)
        {
            return NotFound(new { message = "Artist not found." });
        }

        var artistName = artist.Name;

        var artworks = await _db.Artworks
            .AsNoTracking()
            .Where(a => a.ArtistId == id)
            .OrderByDescending(a => a.Id)
            .Select(a => new
            {
                a.Id,
                a.Title,
                a.Price,
                a.ImageUrl,
                Status = a.Status.ToString(),
                a.ArtistId,
                ArtistName = artistName,
                a.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(artworks);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] ArtistCreateRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "Artist name is required." });
        }

        var artist = new Artist
        {
            Name = request.Name.Trim(),
            Bio = request.Bio?.Trim() ?? string.Empty,
            Nationality = request.Nationality?.Trim() ?? string.Empty,
            ImageUrl = request.ImageUrl?.Trim() ?? string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        await _db.Artists.AddAsync(artist, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = artist.Id }, new
        {
            artist.Id,
            artist.Name,
            artist.Bio,
            artist.Nationality,
            artist.ImageUrl,
            artist.CreatedAt
        });
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] ArtistUpdateRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "Artist name is required." });
        }

        var artist = await _db.Artists.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (artist is null)
        {
            return NotFound(new { message = "Artist not found." });
        }

        artist.Name = request.Name.Trim();
        artist.Bio = request.Bio?.Trim() ?? string.Empty;
        artist.Nationality = request.Nationality?.Trim() ?? string.Empty;
        artist.ImageUrl = request.ImageUrl?.Trim() ?? string.Empty;

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            artist.Id,
            artist.Name,
            artist.Bio,
            artist.Nationality,
            artist.ImageUrl,
            artist.CreatedAt
        });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var artist = await _db.Artists.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (artist is null)
        {
            return NotFound(new { message = "Artist not found." });
        }

        _db.Artists.Remove(artist);
        await _db.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}
