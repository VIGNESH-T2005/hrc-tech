using System.ComponentModel.DataAnnotations;

namespace HrcTech.Application.DTOs.Courses;

public sealed class CourseUpsertRequest
{
    [Required, StringLength(200, MinimumLength = 3)]
    public string Title { get; init; } = string.Empty;

    [Required, StringLength(4000, MinimumLength = 10)]
    public string Description { get; init; } = string.Empty;

    [Required, StringLength(100, MinimumLength = 2)]
    public string Category { get; init; } = string.Empty;

    // INR, at most 2 decimal places (checked in the service).
    [Range(1.0, 1000000.0, ErrorMessage = "Price must be between 1 and 1,000,000.")]
    public decimal Price { get; init; }
}

public sealed class CourseQuery
{
    [StringLength(100)]
    public string? Search { get; init; }

    [StringLength(100)]
    public string? Category { get; init; }

    [Range(1, 10000)]
    public int Page { get; init; } = 1;

    [Range(1, 50)]
    public int PageSize { get; init; } = 12;
}