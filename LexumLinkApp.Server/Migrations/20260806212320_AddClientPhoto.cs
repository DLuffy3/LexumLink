using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LexumLinkApp.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddClientPhoto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PhotoUrl",
                table: "Clients",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PhotoUrl",
                table: "Clients");
        }
    }
}
