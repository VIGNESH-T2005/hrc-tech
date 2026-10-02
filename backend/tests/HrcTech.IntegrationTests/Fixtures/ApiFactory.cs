using HrcTech.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;

namespace HrcTech.IntegrationTests.Fixtures;

public sealed class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _db;

    public const string AdminEmail = "test-admin@hrctech.local";
    public const string AdminPassword = "TestAdmin123";

    public ApiFactory()
    {
        _db = new PostgreSqlBuilder()
            .WithImage("postgres:16-alpine")
            .WithDatabase("hrctech_test")
            .WithUsername("postgres")
            .WithPassword("test_password")
            .Build();

        // Start PostgreSQL before the API host is created.
        _db.StartAsync().GetAwaiter().GetResult();

        Environment.SetEnvironmentVariable(
            "ConnectionStrings__Default",
            _db.GetConnectionString());

        Environment.SetEnvironmentVariable(
            "Jwt__Key",
            "test-signing-key-at-least-32-characters-long");

        Environment.SetEnvironmentVariable(
            "Jwt__Issuer",
            "HrcTech");

        Environment.SetEnvironmentVariable(
            "Jwt__Audience",
            "HrcTech.Client");

        Environment.SetEnvironmentVariable(
            "ADMIN_EMAIL",
            AdminEmail);

        Environment.SetEnvironmentVariable(
            "ADMIN_PASSWORD",
            AdminPassword);

        Environment.SetEnvironmentVariable(
            "ADMIN_NAME",
            "Test Admin");

        Environment.SetEnvironmentVariable(
            "Storage__RootPath",
            Path.Combine(
                Path.GetTempPath(),
                "hrctech-test-storage"));

        Environment.SetEnvironmentVariable(
            "Auth__RefreshCookieSecure",
            "false");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
    }

    public async Task InitializeAsync()
    {
        using var scope = Services.CreateScope();

        var db = scope.ServiceProvider
            .GetRequiredService<AppDbContext>();

        await db.Database.MigrateAsync();
    }

    public new async Task DisposeAsync()
    {
        Environment.SetEnvironmentVariable(
            "ConnectionStrings__Default",
            null);

        Environment.SetEnvironmentVariable(
            "Jwt__Key",
            null);

        Environment.SetEnvironmentVariable(
            "Jwt__Issuer",
            null);

        Environment.SetEnvironmentVariable(
            "Jwt__Audience",
            null);

        Environment.SetEnvironmentVariable(
            "ADMIN_EMAIL",
            null);

        Environment.SetEnvironmentVariable(
            "ADMIN_PASSWORD",
            null);

        Environment.SetEnvironmentVariable(
            "ADMIN_NAME",
            null);

        Environment.SetEnvironmentVariable(
            "Storage__RootPath",
            null);

        Environment.SetEnvironmentVariable(
            "Auth__RefreshCookieSecure",
            null);

        await _db.DisposeAsync();
    }
}