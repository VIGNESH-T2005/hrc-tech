using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using HrcTech.IntegrationTests.Fixtures;
using Xunit;

namespace HrcTech.IntegrationTests;

public class CourseTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task DraftCourse_IsInvisibleOnThePublicApi()
    {
        var adminToken = await LoginAsAdminAsync();
        var courseId = await CreateDraftCourseAsync(adminToken);

        var list = await _client.GetFromJsonAsync<PagedCourses>("/api/courses");
        list!.Items.Should().NotContain(c => c.Id == courseId, "an unpublished course must never appear in the public list");

        var detail = await _client.GetAsync($"/api/courses/{courseId}");
        detail.StatusCode.Should().Be(HttpStatusCode.NotFound, "a draft's detail page must also 404 for the public, not reveal it exists");
    }

    [Fact]
    public async Task PublishingWithNoLessons_IsRejected()
    {
        var adminToken = await LoginAsAdminAsync();
        var courseId = await CreateDraftCourseAsync(adminToken);

        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/admin/courses/{courseId}/publish");
        request.Headers.Add("Authorization", $"Bearer {adminToken}");
        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    private async Task<string> LoginAsAdminAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login",
            new { email = ApiFactory.AdminEmail, password = ApiFactory.AdminPassword });
        var body = await response.Content.ReadFromJsonAsync<LoginResponse>();
        return body!.AccessToken;
    }

    private async Task<Guid> CreateDraftCourseAsync(string adminToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/admin/courses")
        {
            Content = JsonContent.Create(new
            {
                title = $"Test Course {Guid.NewGuid():N}",
                description = "A course created purely for automated testing.",
                category = "Testing",
                price = 499
            })
        };
        request.Headers.Add("Authorization", $"Bearer {adminToken}");
        var response = await _client.SendAsync(request);
        var body = await response.Content.ReadFromJsonAsync<CourseDto>();
        return body!.Id;
    }

    private sealed record LoginResponse(string AccessToken, int ExpiresIn, object User);
    private sealed record CourseDto(Guid Id);
    private sealed record PagedCourses(List<CourseDto> Items);
}