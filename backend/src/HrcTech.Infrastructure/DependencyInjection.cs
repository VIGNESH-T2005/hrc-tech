using HrcTech.Application.Interfaces;
using HrcTech.Application.Settings;
using HrcTech.Domain.Entities;
using HrcTech.Infrastructure.Auth;
using HrcTech.Infrastructure.Courses;
using HrcTech.Infrastructure.Lessons;
using HrcTech.Infrastructure.Persistence;
using HrcTech.Infrastructure.Persistence.Seed;
using HrcTech.Infrastructure.Processing;
using HrcTech.Infrastructure.Security;
using HrcTech.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using HrcTech.Infrastructure.Content;
using HrcTech.Infrastructure.Enrollments;

namespace HrcTech.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("ConnectionStrings:Default is not configured.");

        if (string.IsNullOrWhiteSpace(configuration["Storage:RootPath"]))
            throw new InvalidOperationException("Storage:RootPath is not configured. Set it with user-secrets or an environment variable.");

        services.AddDbContext<AppDbContext>(o => o.UseNpgsql(connectionString));

        services.AddIdentityCore<ApplicationUser>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.Password.RequiredLength = 8;
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = false;
                options.Lockout.AllowedForNewUsers = true;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            })
            .AddRoles<ApplicationRole>()
            .AddEntityFrameworkStores<AppDbContext>();

        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<AuthOptions>(configuration.GetSection(AuthOptions.SectionName));
        services.Configure<StorageOptions>(configuration.GetSection(StorageOptions.SectionName));
        services.Configure<ProcessingOptions>(configuration.GetSection(ProcessingOptions.SectionName));
        services.Configure<ContentAccessOptions>(configuration.GetSection(ContentAccessOptions.SectionName));
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICourseCatalogService, CourseCatalogService>();
        services.AddScoped<IAdminCourseService, AdminCourseService>();
        services.AddScoped<IAdminLessonService, AdminLessonService>();
        services.AddScoped<IEnrollmentService, EnrollmentService>();
        services.AddScoped<IContentAccessService, ContentAccessService>();
        services.AddScoped<IProgressService, ProgressService>();
        services.AddScoped<AdminSeeder>();

        services.AddSingleton<IFileStorage, LocalFileStorage>();
        services.AddSingleton<IVideoProcessor, FfmpegVideoProcessor>();
        services.AddSingleton<IPdfProcessor, PdfWatermarker>();
        services.AddSingleton<ProcessingQueue>();
        services.AddSingleton<IProcessingQueue>(sp => sp.GetRequiredService<ProcessingQueue>());
        services.AddScoped<LessonProcessor>();
        services.AddHostedService<LessonProcessingWorker>();

        return services;
    }
}