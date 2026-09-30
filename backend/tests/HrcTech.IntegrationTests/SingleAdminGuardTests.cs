using FluentAssertions;
using HrcTech.Domain.Constants;
using HrcTech.Infrastructure.Persistence;
using HrcTech.IntegrationTests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Xunit;

namespace HrcTech.IntegrationTests;

public class SingleAdminGuardTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Seeder_CreatesExactlyOneAdmin()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var adminCount = await db.UserRoles.CountAsync(r => r.RoleId == Roles.AdminRoleId);

        adminCount.Should().Be(1);
    }

    [Fact]
    public async Task Database_RejectsASecondAdminRow_EvenIfApplicationCodeHasABug()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var act = () => db.Database.ExecuteSqlRawAsync(
            "INSERT INTO \"AspNetUserRoles\" (\"UserId\", \"RoleId\") VALUES (gen_random_uuid(), {0})",
            Roles.AdminRoleId);

        await act.Should().ThrowAsync<PostgresException>()
            .Where(e => e.SqlState == "23505", "the partial unique index must block a second admin at the database level");
    }
}