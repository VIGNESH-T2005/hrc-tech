using HrcTech.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;

namespace HrcTech.IntegrationTests.Fixtures;

// One real PostgreSQL container per test run, migrated fresh, admin seeded once.
// Every test class shares it via IClassFixture<ApiFactory> for speed.
public sealed class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _db = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("hrctech_test")
        .WithUsername("postgres")
        .WithPassword("test_password")
        .Build();

    public const string AdminEmail = "test-admin@hrctech.local";
    public const string AdminPassword = "TestAdmin123";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Default"] = _db.GetConnectionString(),
                ["Jwt:Key"] = "test-signing-key-at-least-32-characters-long",
                ["Jwt:Issuer"] = "HrcTech",
                ["Jwt:Audience"] = "HrcTech.Client",
                ["ADMIN_EMAIL"] = AdminEmail,
                ["ADMIN_PASSWORD"] = AdminPassword,
                ["ADMIN_NAME"] = "Test Admin",
                ["Storage:RootPath"] = Path.Combine(Path.GetTempPath(), "hrctech-test-storage"),
                ["Database:MigrateOnStartup"] = "true",
                ["Auth:RefreshCookieSecure"] = "false"
            });
        });
    }

    public async Task InitializeAsync()
    {
        await _db.StartAsync();
        using var scope = Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.MigrateAsync();
    }

    public new async Task DisposeAsync() => await _db.DisposeAsync();
}