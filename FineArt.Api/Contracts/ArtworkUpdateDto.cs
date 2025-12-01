namespace FineArt.Api.Contracts;

public record ArtworkUpdateDto(
    string Title,
    string Description,
    string MainTheme,
    string? SubTheme,
    string Size,
    int? WidthCm,
    int? HeightCm,
    string? SizeBucket,
    string Material,
    int Price,
    bool IsRentable,
    int? RentPrice,
    string? ImageUrl,
    string Status,
    int ArtistId);
