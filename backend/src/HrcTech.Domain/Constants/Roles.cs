namespace HrcTech.Domain.Constants;

public static class Roles
{
    public const string Admin = "Admin";
    public const string Student = "Student";

    // Fixed IDs so the database itself can enforce "exactly one admin".
    public const string AdminRoleIdValue = "3f1c2d9e-7b41-4c2a-9a6e-5d8b1e0f4a11";
    public const string StudentRoleIdValue = "8a7d5c3b-2e94-4f61-b0c7-1a9e6d3f2b22";

    public static readonly Guid AdminRoleId = Guid.Parse(AdminRoleIdValue);
    public static readonly Guid StudentRoleId = Guid.Parse(StudentRoleIdValue);
}