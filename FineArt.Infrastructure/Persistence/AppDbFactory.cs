using System;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;

namespace FineArt.Infrastructure.Persistence;

public class AppDbFactory : IDesignTimeDbContextFactory<AppDb>
{
    public AppDb CreateDbContext(string[] args)
    {
        var basePath = Directory.GetCurrentDirectory();
        var apiPath = Path.Combine(basePath, "..", "FineArt.Api");

        var configuration = new ConfigurationBuilder()
            .SetBasePath(apiPath)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var cs = configuration.GetConnectionString("MySql");
        if (string.IsNullOrWhiteSpace(cs))
        {
            throw new InvalidOperationException("MySql connection string was not found.");
        }

        var optionsBuilder = new DbContextOptionsBuilder<AppDb>();
        optionsBuilder.UseMySql(cs, ResolveServerVersion(cs));

        return new AppDb(optionsBuilder.Options);
    }

    private static ServerVersion ResolveServerVersion(string connectionString)
    {
        try
        {
            return ServerVersion.AutoDetect(connectionString);
        }
        catch
        {
            return ServerVersion.Create(new Version(8, 0, 36), ServerType.MySql);
        }
    }
}
