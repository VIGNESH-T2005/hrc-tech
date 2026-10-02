using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using HrcTech.IntegrationTests.Fixtures;
using Xunit;

namespace HrcTech.IntegrationTests;

public class AuthTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Register_IgnoresClientSuppliedRole_AndCreatesAStudent()
    {
        var email = $"student-{Guid.NewGuid():N}@test.local";

        // The request body deliberately includes an extra "role" field the API doesn't define.
        var response = await _client.PostAsJsonAsync("/api/auth/register",
            new { name = "Test Student", email, password = "Student123", role = "Admin" });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<RegisterResponse>();
        body!.Role.Should().Be("Student", "the server must decide the role, never the client");
    }

    [Fact]
    public async Task Register_DuplicateEmail_ReturnsConflict()
    {
        var email = $"dup-{Guid.NewGuid():N}@test.local";

        var first = await _client.PostAsJsonAsync("/api/auth/register",
            new { name = "Test User", email, password = "Password123" });
        first.StatusCode.Should().Be(HttpStatusCode.Created, "the first registration must succeed to test the duplicate case");

        var second = await _client.PostAsJsonAsync("/api/auth/register",
            new { name = "Test User Two", email, password = "Password123" });

        second.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Login_WrongPassword_ReturnsUnauthorizedWithGenericMessage()
    {
        var email = $"login-{Guid.NewGuid():N}@test.local";
        var register = await _client.PostAsJsonAsync("/api/auth/register",
            new { name = "Test User", email, password = "Password123" });
        register.StatusCode.Should().Be(HttpStatusCode.Created);

        var response = await _client.PostAsJsonAsync("/api/auth/login", new { email, password = "WrongPassword1" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        var body = await response.Content.ReadFromJsonAsync<MessageResponse>();
        body!.Message.Should().NotContain(email, "the error must not confirm whether the account exists");
    }

    [Fact]
    public async Task AdminOnlyEndpoint_RejectsStudentToken_With403()
    {
        var token = await RegisterAndLoginStudentAsync();

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/admin/courses");
        request.Headers.Add("Authorization", $"Bearer {token}");
        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task AdminOnlyEndpoint_RejectsAnonymous_With401()
    {
        var response = await _client.GetAsync("/api/admin/courses");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    private async Task<string> RegisterAndLoginStudentAsync()
    {
        var email = $"forbidden-{Guid.NewGuid():N}@test.local";

        var register = await _client.PostAsJsonAsync("/api/auth/register",
            new { name = "Test Student", email, password = "Password123" });
        register.StatusCode.Should().Be(HttpStatusCode.Created, "registration must succeed before login can be tested");

        var login = await _client.PostAsJsonAsync("/api/auth/login", new { email, password = "Password123" });
        var raw = await login.Content.ReadAsStringAsync();
        login.IsSuccessStatusCode.Should().BeTrue($"student login must succeed to run this test. Response: {raw}");

        var body = await login.Content.ReadFromJsonAsync<LoginResponse>();
        body!.AccessToken.Should().NotBeNullOrEmpty();
        return body.AccessToken;
    }

    private sealed record RegisterResponse(Guid Id, string Name, string Email, string Role);
    private sealed record LoginResponse(string AccessToken, int ExpiresIn, object User);
    private sealed record MessageResponse(string Message);
}