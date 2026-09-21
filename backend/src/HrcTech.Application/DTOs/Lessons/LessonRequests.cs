using System.ComponentModel.DataAnnotations;
using HrcTech.Domain.Enums;

namespace HrcTech.Application.DTOs.Lessons;

public sealed class LessonUpsertRequest
{
    [Required, StringLength(200, MinimumLength = 2)]
    public string Title { get; init; } = string.Empty;

    [StringLength(2000)]
    public string? Description { get; init; }

    [EnumDataType(typeof(LessonContentType), ErrorMessage = "ContentType must be Video or Pdf.")]
    public LessonContentType ContentType { get; init; }
}

public sealed class LessonOrderRequest
{
    [Required, MinLength(1)]
    public List<Guid> LessonIds { get; init; } = [];
}