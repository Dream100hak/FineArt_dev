using Microsoft.AspNetCore.Http;

namespace FineArt.Api.Contracts;

public class UploadRequest
{
    public IFormFile File { get; set; } = default!;
}
