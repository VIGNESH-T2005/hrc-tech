using HrcTech.Domain.Entities;
using HrcTech.Domain.Enums;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using RoleNames = HrcTech.Domain.Constants.Roles;

namespace HrcTech.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>(options)
{
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Lesson> Lessons => Set<Lesson>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(b =>
        {
            b.Property(u => u.Name).IsRequired().HasMaxLength(100);
            b.Property(u => u.CreatedAt).IsRequired();
        });

        builder.Entity<RefreshToken>(b =>
        {
            b.HasKey(t => t.Id);
            b.Property(t => t.TokenHash).IsRequired().HasMaxLength(64);
            b.HasIndex(t => t.TokenHash).IsUnique();
            b.HasIndex(t => t.UserId);
            b.HasOne<ApplicationUser>().WithMany().HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Course>(b =>
        {
            b.HasKey(c => c.Id);
            b.Property(c => c.Title).IsRequired().HasMaxLength(200);
            b.Property(c => c.Description).IsRequired().HasMaxLength(4000);
            b.Property(c => c.Category).IsRequired().HasMaxLength(100);
            b.Property(c => c.Price).HasPrecision(12, 2);
            b.Property(c => c.ThumbnailRef).HasMaxLength(500);
            b.HasIndex(c => new { c.IsPublished, c.Category });
            b.ToTable(t => t.HasCheckConstraint("CK_Courses_Price_Positive", "\"Price\" > 0"));

            // Never delete the admin user by accident through a course.
            b.HasOne<ApplicationUser>().WithMany().HasForeignKey(c => c.CreatedByAdminId).OnDelete(DeleteBehavior.Restrict);

            // Deleting a course removes its lessons.
            b.HasMany(c => c.Lessons).WithOne(l => l.Course).HasForeignKey(l => l.CourseId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Lesson>(b =>
        {
            b.HasKey(l => l.Id);
            b.Property(l => l.Title).IsRequired().HasMaxLength(200);
            b.Property(l => l.Description).HasMaxLength(2000);
            b.Property(l => l.ContentType).HasConversion<string>().HasMaxLength(20);
            b.Property(l => l.OriginalFileName).HasMaxLength(255);
            b.Property(l => l.RawFileRef).HasMaxLength(500);
            b.Property(l => l.ProcessedFileRef).HasMaxLength(500);
            b.Property(l => l.ProcessingStatus).HasConversion<string>().HasMaxLength(20).HasDefaultValue(ProcessingStatus.NoContent);
            b.Property(l => l.ProcessingStage).HasMaxLength(30);
            b.Property(l => l.ProcessingError).HasMaxLength(500);
            b.HasIndex(l => new { l.CourseId, l.LessonOrder }).IsUnique();
            b.HasIndex(l => l.ProcessingStatus);
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