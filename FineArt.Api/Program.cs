using System.Text;
using System.Text.Json;
using FineArt.Api.Contracts;
using FineArt.Application.Articles;
using FineArt.Application.BoardTypes;
using FineArt.Application.Artworks;
using FineArt.Application.Auth;
using FineArt.Application.Exhibitions;
using FineArt.Infrastructure.Auth;
using FineArt.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

var cs = builder.Configuration.GetConnectionString("MySql");
builder.Services.AddDbContext<AppDb>(o => o.UseMySql(cs, ServerVersion.AutoDetect(cs)));

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));

var jwtOptions = new JwtOptions();
builder.Configuration.GetSection("Jwt").Bind(jwtOptions);
if (string.IsNullOrWhiteSpace(jwtOptions.Key))
{
    throw new InvalidOperationException("JWT Key is not configured.");
}

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtOptions.Issuer,
        ValidateAudience = true,
        ValidAudience = jwtOptions.Audience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = signingKey,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(1)
    };

    options.Events = new JwtBearerEvents
    {
        OnChallenge = context =>
        {
            context.HandleResponse();
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            var payload = JsonSerializer.Serialize(new { message = "Authentication is required." });
            return context.Response.WriteAsync(payload, context.HttpContext.RequestAborted);
        },
        OnForbidden = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            var payload = JsonSerializer.Serialize(new { message = "Access is forbidden." });
            return context.Response.WriteAsync(payload, context.HttpContext.RequestAborted);
        }
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
});

builder.Services.AddControllers();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<DbContext>(sp => sp.GetRequiredService<AppDb>());
builder.Services.AddScoped<ArtworkQueryService>();
builder.Services.AddScoped<ArtworkCommandService>();
builder.Services.AddScoped<ArticleQueryService>();
builder.Services.AddScoped<ArticleCommandService>();
builder.Services.AddScoped<BoardTypeQueryService>();
builder.Services.AddScoped<BoardTypeCommandService>();
builder.Services.AddScoped<ExhibitionQueryService>();
builder.Services.AddScoped<ExhibitionCommandService>();

builder.Services.AddCors(o => o.AddPolicy("react", p => p
    .WithOrigins("http://localhost:3000", "http://localhost:3001", "https://fineart.co.kr", "https://admin.fineart.co.kr")
    .AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "FineArt API",
        Version = "v1"
    });

    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Bearer {token}"
    };

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme. Example: 'Bearer {token}'",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
{
    {
        new OpenApiSecurityScheme
        {
            Reference = new OpenApiReference
            {
                Type = ReferenceType.SecurityScheme,
                Id = "Bearer"
            }
        },
        new string[] {}
    }
});
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDb>();
    db.Database.Migrate();
}

app.UseCors("react");

app.UseStaticFiles();

app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "FineArt API v1");
    options.RoutePrefix = string.Empty; // serve Swagger UI at root
});

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/healthz", () => Results.Ok(new { ok = true, ts = DateTime.UtcNow }));

app.MapPost("/auth/register", async (RegisterRequest request, AuthService authService, CancellationToken cancellationToken) =>
{
    var result = await authService.RegisterAsync(request.Email, request.Password, request.Role, cancellationToken);
    return result.Success
        ? Results.Ok(new AuthResponse(result.Token!, result.ExpiresAt!.Value))
        : Results.BadRequest(new { message = result.Error });
});

app.MapPost("/auth/login", async (LoginRequest request, AuthService authService, CancellationToken cancellationToken) =>
{
    var result = await authService.LoginAsync(request.Email, request.Password, cancellationToken);
    return result.Success
        ? Results.Ok(new AuthResponse(result.Token!, result.ExpiresAt!.Value))
        : Results.BadRequest(new { message = result.Error });
});

app.MapControllers();

app.Run();
