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
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<LessonProgress> LessonProgress => Set<LessonProgress>();
    public DbSet<ContentAccessToken> ContentAccessTokens => Set<ContentAccessToken>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<WebhookEvent> WebhookEvents => Set<WebhookEvent>();
    
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

        builder.Entity<Enrollment>(b =>
        {
            b.HasKey(e => e.Id);
            b.HasIndex(e => new { e.StudentId, e.CourseId }).IsUnique().HasFilter("\"Status\" = 'Active'");
            b.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);
            b.HasOne<ApplicationUser>().WithMany().HasForeignKey(e => e.StudentId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(e => e.Course).WithMany().HasForeignKey(e => e.CourseId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<LessonProgress>(b =>
        {
            b.HasKey(p => p.Id);
            b.HasIndex(p => new { p.StudentId, p.LessonId }).IsUnique();
            b.HasIndex(p => new { p.StudentId, p.CourseId });
            b.HasOne<ApplicationUser>().WithMany().HasForeignKey(p => p.StudentId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne<Lesson>().WithMany().HasForeignKey(p => p.LessonId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne<Course>().WithMany().HasForeignKey(p => p.CourseId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<ContentAccessToken>(b =>
        {
            b.HasKey(t => t.Id);
            b.Property(t => t.TokenHash).IsRequired().HasMaxLength(64);
            b.HasIndex(t => t.TokenHash).IsUnique();
            b.HasIndex(t => new { t.LessonId, t.ExpiresAt });
            b.HasOne<ApplicationUser>().WithMany().HasForeignKey(t => t.StudentId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne<Lesson>().WithMany().HasForeignKey(t => t.LessonId).OnDelete(DeleteBehavior.Cascade);
        });
        
                builder.Entity<Payment>(b =>
        {
            b.HasKey(p => p.Id);
            b.Property(p => p.Amount).HasPrecision(12, 2);
            b.Property(p => p.Currency).HasMaxLength(3);
            b.Property(p => p.Gateway).HasMaxLength(30);
            b.Property(p => p.GatewayOrderId).HasMaxLength(255);
            b.Property(p => p.GatewayPaymentId).HasMaxLength(255);
            b.Property(p => p.Status).HasConversion<string>().HasMaxLength(20);
            b.HasIndex(p => p.GatewayOrderId).IsUnique().HasFilter("\"GatewayOrderId\" IS NOT NULL");
            b.HasIndex(p => p.GatewayPaymentId).IsUnique().HasFilter("\"GatewayPaymentId\" IS NOT NULL");
            b.HasIndex(p => new { p.StudentId, p.CourseId, p.Status });
            b.HasOne<ApplicationUser>().WithMany().HasForeignKey(p => p.StudentId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(p => p.Course).WithMany().HasForeignKey(p => p.CourseId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<WebhookEvent>(b =>
        {
            b.HasKey(w => w.Id);
            b.Property(w => w.GatewayEventId).IsRequired().HasMaxLength(255);
            b.HasIndex(w => w.GatewayEventId).IsUnique();
        });

        builder.Entity<Enrollment>().HasOne<Payment>().WithMany().HasForeignKey(e => e.PaymentId).OnDelete(DeleteBehavior.SetNull);
        
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