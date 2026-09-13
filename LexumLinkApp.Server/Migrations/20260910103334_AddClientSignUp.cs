using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LexumLinkApp.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddClientSignUp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SalesNotificationEmail",
                table: "PlatformSettings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "ClientRegistrations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientReferenceNumber = table.Column<string>(type: "text", nullable: false),
                    CompanyName = table.Column<string>(type: "text", nullable: false),
                    TradingName = table.Column<string>(type: "text", nullable: true),
                    CompanyRegistrationNumber = table.Column<string>(type: "text", nullable: true),
                    VatNumber = table.Column<string>(type: "text", nullable: true),
                    NatureOfBusiness = table.Column<string>(type: "text", nullable: true),
                    ContactFullName = table.Column<string>(type: "text", nullable: false),
                    ContactPosition = table.Column<string>(type: "text", nullable: true),
                    ContactMobile = table.Column<string>(type: "text", nullable: false),
                    ContactAlternateNumber = table.Column<string>(type: "text", nullable: true),
                    ContactEmail = table.Column<string>(type: "text", nullable: false),
                    ContactWhatsApp = table.Column<string>(type: "text", nullable: true),
                    PhysicalAddress = table.Column<string>(type: "text", nullable: false),
                    PostalAddress = table.Column<string>(type: "text", nullable: true),
                    Province = table.Column<string>(type: "text", nullable: true),
                    PostalCode = table.Column<string>(type: "text", nullable: true),
                    ServicePackage = table.Column<string>(type: "text", nullable: false),
                    ServicePackageOther = table.Column<string>(type: "text", nullable: true),
                    AdditionalRequirements = table.Column<string>(type: "text", nullable: true),
                    MonthlyServiceFee = table.Column<decimal>(type: "numeric", nullable: true),
                    PaymentDuePreference = table.Column<string>(type: "text", nullable: true),
                    PaymentDueOther = table.Column<string>(type: "text", nullable: true),
                    DeclarationAccepted = table.Column<bool>(type: "boolean", nullable: false),
                    PopiaConsent = table.Column<bool>(type: "boolean", nullable: false),
                    ClientInitials = table.Column<string>(type: "text", nullable: false),
                    SignedFullName = table.Column<string>(type: "text", nullable: false),
                    SignedPosition = table.Column<string>(type: "text", nullable: true),
                    SignatureImageUrl = table.Column<string>(type: "text", nullable: false),
                    SignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IpAddress = table.Column<string>(type: "text", nullable: true),
                    UserAgent = table.Column<string>(type: "text", nullable: true),
                    AgreementSnapshot = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ReviewedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RejectionReason = table.Column<string>(type: "text", nullable: true),
                    LinkedOrganizationId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientRegistrations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClientRegistrations_Organizations_LinkedOrganizationId",
                        column: x => x.LinkedOrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ClientRegistrations_Users_ReviewedByUserId",
                        column: x => x.ReviewedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClientRegistrations_LinkedOrganizationId",
                table: "ClientRegistrations",
                column: "LinkedOrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientRegistrations_ReviewedByUserId",
                table: "ClientRegistrations",
                column: "ReviewedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClientRegistrations");

            migrationBuilder.DropColumn(
                name: "SalesNotificationEmail",
                table: "PlatformSettings");
        }
    }
}
