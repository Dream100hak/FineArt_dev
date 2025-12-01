using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FineArt.Domain;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace FineArt.Application.Auth;

public class AuthService
{
    private readonly IUserRepository _users;
    private readonly IPasswordHasher _passwordHasher;
    private readonly JwtOptions _jwtOptions;
    private readonly TimeProvider _timeProvider;

    public AuthService(
        IUserRepository users,
        IPasswordHasher passwordHasher,
        IOptions<JwtOptions> jwtOptions,
        TimeProvider timeProvider)
    {
        _users = users;
        _passwordHasher = passwordHasher;
        _jwtOptions = jwtOptions.Value;
        _timeProvider = timeProvider;
    }

    public async Task<AuthResult> RegisterAsync(string email, string password, string? role = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            return AuthResult.Fail("이메일과 비밀번호는 필수입니다.");
        }

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var existing = await _users.GetByEmailAsync(normalizedEmail, cancellationToken);
        if (existing is not null)
        {
            return AuthResult.Fail("이미 등록된 이메일입니다.");
        }

        var user = new User
        {
            Email = normalizedEmail,
            PasswordHash = _passwordHasher.Hash(password),
            Role = string.IsNullOrWhiteSpace(role) ? "User" : role.Trim()
        };

        await _users.AddAsync(user, cancellationToken);
        return GenerateToken(user);
    }

    public async Task<AuthResult> LoginAsync(string email, string password, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            return AuthResult.Fail("이메일과 비밀번호는 필수입니다.");
        }

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _users.GetByEmailAsync(normalizedEmail, cancellationToken);
        if (user is null || !_passwordHasher.Verify(user.PasswordHash, password))
        {
            return AuthResult.Fail("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        return GenerateToken(user);
    }

    private AuthResult GenerateToken(User user)
    {
        if (string.IsNullOrWhiteSpace(_jwtOptions.Key))
        {
            return AuthResult.Fail("JWT 설정이 올바르지 않습니다.");
        }

        var now = _timeProvider.GetUtcNow();
        var expires = now.AddMinutes(Math.Max(1, _jwtOptions.ExpirationMinutes));

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Role, user.Role)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtOptions.Issuer,
            audience: _jwtOptions.Audience,
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: expires.UtcDateTime,
            signingCredentials: creds);

        var tokenValue = new JwtSecurityTokenHandler().WriteToken(token);
        return AuthResult.Ok(tokenValue, expires);
    }
}
