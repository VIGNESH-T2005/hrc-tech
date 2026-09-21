using System.Text.Json.Serialization;
using HrcTech.Api.Extensions;
using HrcTech.Api.Middleware;
using HrcTech.Infrastructure;
using HrcTech.Infrastructure.Persistence;
using HrcTech.Infrastructure.Persistence.Seed;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddAuthorizationPolicies();
builder.Services.AddAuthRateLimiting(builder.Configuration);

builder.Services.AddControllers()
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()))
    .ConfigureApiBehaviorOptions(options =>
    {
        // Validation failures use the same { "message": ... } shape as every other error.
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(e => e.Value?.Errors.Count > 0)
                .ToDictionary(e => e.Key, e => e.Value!.Errors.Select(x => x.ErrorMessage).ToArray());

            var first = errors.Values.SelectMany(x => x).FirstOrDefault() ?? "The request is invalid.";
            return new BadRequestObjectResult(new { message = first, errors });
        };
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerWithJwt();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()));   // required for the httpOnly refresh cookie

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Note: there is deliberately NO app.UseStaticFiles(). Uploaded files are never served directly.
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Database:MigrateOnStartup"))
    {
        await db.Database.MigrateAsync();
    }

    await scope.ServiceProvider.GetRequiredService<AdminSeeder>().SeedAsync();
}

app.Run();