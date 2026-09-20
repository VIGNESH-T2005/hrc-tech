namespace HrcTech.Infrastructure.Courses;

internal static class CourseMapping
{
    // The thumbnail endpoint arrives in Phase 5. Until a thumbnail exists this is always null.
    public static string? ThumbnailUrl(Guid courseId, bool hasThumbnail) =>
        hasThumbnail ? $"/api/courses/{courseId}/thumbnail" : null;
}