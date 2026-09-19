using HrcTech.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using RoleNames = HrcTech.Domain.Constants.Roles;

namespace HrcTech.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>(options)
{
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(b =>
        {
            b.Property(u => u.Name).IsRequired().HasMaxLength(100);
            b.Property(u => u.CreatedAt).IsRequired();
        });

        // Roles are seeded with fixed IDs. No API can create or edit roles.
        builder.Entity<ApplicationRole>().HasData(
            new ApplicationRole
            {
                Id = RoleNames.AdminRoleId,
                Name = RoleNames.Admin,
                NormalizedName = RoleNames.Admin.ToUpperInvariant(),
                ConcurrencyStamp = "a1b2c3d4-0001-4000-8000-000000000001"
            },
            new ApplicationRole
            {
                Id = RoleNames.StudentRoleId,
                Name = RoleNames.Student,
                NormalizedName = RoleNames.Student.ToUpperInvariant(),
                ConcurrencyStamp = "a1b2c3d4-0002-4000-8000-000000000002"
            });
    }
}