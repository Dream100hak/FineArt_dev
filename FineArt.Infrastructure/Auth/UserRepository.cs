using FineArt.Application.Auth;
using FineArt.Domain;
using FineArt.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FineArt.Infrastructure.Auth;

public class UserRepository : IUserRepository
{
    private readonly AppDb _db;

    public UserRepository(AppDb db)
    {
        _db = db;
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalized = email.Trim().ToLowerInvariant();
        return await _db.Users.FirstOrDefaultAsync(u => u.Email == normalized, cancellationToken);
    }

    public async Task AddAsync(User user, CancellationToken cancellationToken = default)
    {
        user.Email = user.Email.Trim().ToLowerInvariant();
        user.Role = string.IsNullOrWhiteSpace(user.Role) ? "User" : user.Role.Trim();
        await _db.Users.AddAsync(user, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
