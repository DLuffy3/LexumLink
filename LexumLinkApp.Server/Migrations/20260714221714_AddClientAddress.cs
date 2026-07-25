using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LexumLinkApp.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddClientAddress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AssignedUserId",
                table: "Cases",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ClosedAt",
                table: "Cases",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeadlineDate",
                table: "Cases",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Cases_AssignedUserId",
                table: "Cases",
                column: "AssignedUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Cases_Users_AssignedUserId",
                table: "Cases",
                column: "AssignedUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Cases_Users_AssignedUserId",
                table: "Cases");

            migrationBuilder.DropIndex(
                name: "IX_Cases_AssignedUserId",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "AssignedUserId",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "ClosedAt",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "DeadlineDate",
                table: "Cases");
        }
    }
}
