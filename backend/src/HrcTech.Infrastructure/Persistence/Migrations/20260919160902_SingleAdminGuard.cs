using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HrcTech.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SingleAdminGuard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
        CREATE UNIQUE INDEX "UX_AspNetUserRoles_SingleAdmin"
        ON "AspNetUserRoles" ("RoleId")
        WHERE "RoleId" = '3f1c2d9e-7b41-4c2a-9a6e-5d8b1e0f4a11';
        """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""DROP INDEX "UX_AspNetUserRoles_SingleAdmin";""");
        }
    }
}
