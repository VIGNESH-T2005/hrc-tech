using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HrcTech.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLessonFilesAndProcessing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OriginalFileName",
                table: "Lessons",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PageCount",
                table: "Lessons",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ProcessedAt",
                table: "Lessons",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProcessedFileRef",
                table: "Lessons",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "ProcessedSizeBytes",
                table: "Lessons",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProcessingError",
                table: "Lessons",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProcessingStage",
                table: "Lessons",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProcessingStatus",
                table: "Lessons",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "NoContent");

            migrationBuilder.AddColumn<string>(
                name: "RawFileRef",
                table: "Lessons",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Lessons",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_Lessons_ProcessingStatus",
                table: "Lessons",
                column: "ProcessingStatus");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Lessons_ProcessingStatus",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "OriginalFileName",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "PageCount",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "ProcessedAt",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "ProcessedFileRef",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "ProcessedSizeBytes",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "ProcessingError",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "ProcessingStage",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "ProcessingStatus",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "RawFileRef",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Lessons");
        }
    }
}
