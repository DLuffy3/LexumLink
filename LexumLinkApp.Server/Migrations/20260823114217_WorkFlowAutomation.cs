using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LexumLinkApp.Server.Migrations
{
    /// <inheritdoc />
    public partial class WorkFlowAutomation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CaseArchiveDays",
                table: "PlatformSettings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CaseIdleDays",
                table: "PlatformSettings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "ArchivedAt",
                table: "Cases",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "Cases",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "StaleNotifiedAt",
                table: "Cases",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CaseArchiveDays",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "CaseIdleDays",
                table: "PlatformSettings");

            migrationBuilder.DropColumn(
                name: "ArchivedAt",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "IsArchived",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "StaleNotifiedAt",
                table: "Cases");
        }
    }
}
