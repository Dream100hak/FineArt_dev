namespace FineArt.Api.Contracts;

public record ArticleUpdateRequest(
    int BoardTypeId,
    string Title,
    string Content,
    string Writer,
    string Email,
    string? Category,
    string? ImageUrl,
    string? ThumbnailUrl,
    bool IsPinned = false);
