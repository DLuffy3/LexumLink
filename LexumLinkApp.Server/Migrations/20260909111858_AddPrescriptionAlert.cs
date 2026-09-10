using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace LexumLinkApp.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddPrescriptionAlert : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LodgementDate",
                table: "Cases",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "MatterTypeId",
                table: "Cases",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PrescriptionReminderStage",
                table: "Cases",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "StatutoryNoticeDate",
                table: "Cases",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SummonsServedDate",
                table: "Cases",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SupervisorUserId",
                table: "Cases",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CaseEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CaseId = table.Column<Guid>(type: "uuid", nullable: false),
                    EventType = table.Column<string>(type: "text", nullable: false),
                    EventDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    AddedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CaseEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CaseEvents_Cases_CaseId",
                        column: x => x.CaseId,
                        principalTable: "Cases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CaseEvents_Users_AddedByUserId",
                        column: x => x.AddedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "MatterTypes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    DefaultPeriodMonths = table.Column<int>(type: "integer", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatterTypes", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "MatterTypes",
                columns: new[] { "Id", "DefaultPeriodMonths", "IsActive", "Name", "Notes", "SortOrder" },
                values: new object[,]
                {
                    { new Guid("a1000000-0000-0000-0000-000000000001"), 36, true, "Accident (RAF)", "RAF Act s23: 3 years from date of accident, subject to lodgement requirements. Verify against current legislation.", 1 },
                    { new Guid("a1000000-0000-0000-0000-000000000002"), 24, true, "Hit and run (unidentified vehicle)", "RAF Act s17(1)(b): 2 years to lodge an unidentified-vehicle claim.", 2 },
                    { new Guid("a1000000-0000-0000-0000-000000000003"), 24, true, "Carriage by air (baggage)", "Montreal Convention Art 35: 2 years from date of arrival.", 3 },
                    { new Guid("a1000000-0000-0000-0000-000000000004"), 24, true, "Carriage by air (cargo)", "Montreal Convention Art 35: 2 years from date of arrival.", 4 },
                    { new Guid("a1000000-0000-0000-0000-000000000005"), 24, true, "Carriage by air (delay)", "Montreal Convention Art 35: 2 years from date of arrival.", 5 },
                    { new Guid("a1000000-0000-0000-0000-000000000006"), null, true, "Sheriffs", "Period depends on the specific claim against the sheriff — set the Prescription Date manually.", 6 },
                    { new Guid("a1000000-0000-0000-0000-000000000007"), null, true, "Apportionment of Damages Act", "Contribution claims are fact-dependent — set the Prescription Date manually.", 7 },
                    { new Guid("a1000000-0000-0000-0000-000000000008"), 24, true, "Compensation for Occupational Injuries and Diseases Act 130 of 1993", "Verify against COIDA and the specific claim (compensation claim vs. common-law employer claim).", 8 },
                    { new Guid("a1000000-0000-0000-0000-000000000009"), 36, true, "Institution of Legal Proceedings Against Certain Organs of State Act 40 of 2002", "3-year prescription; separately requires statutory notice within 6 months — capture via Statutory Notice Date.", 9 },
                    { new Guid("a1000000-0000-0000-0000-00000000000a"), 360, true, "Mortgage Bond / Judgment Debt / Taxation / Mine Minerals", "Prescription Act s11(a): 30 years.", 10 },
                    { new Guid("a1000000-0000-0000-0000-00000000000b"), 180, true, "Debt Owed to State in Defined Circumstances", "Prescription Act s11(a)(iii): 15 years — verify the debt falls into this category.", 11 },
                    { new Guid("a1000000-0000-0000-0000-00000000000c"), 72, true, "Debt from Bill of Exchange / Negotiable Instrument / Notarial Contract", "Prescription Act s11(b): 6 years.", 12 },
                    { new Guid("a1000000-0000-0000-0000-00000000000d"), 36, true, "Any Other Debts / Civil Claims", "Prescription Act s11(d): default 3 years for debts not otherwise specified.", 13 },
                    { new Guid("a1000000-0000-0000-0000-00000000000e"), null, true, "Execution Against the Property of a Judgment Debtor", "Procedural step, not a fixed prescription period — set the Prescription Date manually.", 14 },
                    { new Guid("a1000000-0000-0000-0000-00000000000f"), null, true, "Review of Arbitration Awards (Labour Court)", "LRA s145 review applications: strict 6-week deadline — set the Prescription Date manually.", 15 },
                    { new Guid("a1000000-0000-0000-0000-000000000010"), null, true, "Arbitration Award Made an Order of the Labour Court", "Enforcement timing is fact-dependent — set the Prescription Date manually.", 16 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Cases_MatterTypeId",
                table: "Cases",
                column: "MatterTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Cases_SupervisorUserId",
                table: "Cases",
                column: "SupervisorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseEvents_AddedByUserId",
                table: "CaseEvents",
                column: "AddedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseEvents_CaseId",
                table: "CaseEvents",
                column: "CaseId");

            migrationBuilder.AddForeignKey(
                name: "FK_Cases_MatterTypes_MatterTypeId",
                table: "Cases",
                column: "MatterTypeId",
                principalTable: "MatterTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Cases_Users_SupervisorUserId",
                table: "Cases",
                column: "SupervisorUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Cases_MatterTypes_MatterTypeId",
                table: "Cases");

            migrationBuilder.DropForeignKey(
                name: "FK_Cases_Users_SupervisorUserId",
                table: "Cases");

            migrationBuilder.DropTable(
                name: "CaseEvents");

            migrationBuilder.DropTable(
                name: "MatterTypes");

            migrationBuilder.DropIndex(
                name: "IX_Cases_MatterTypeId",
                table: "Cases");

            migrationBuilder.DropIndex(
                name: "IX_Cases_SupervisorUserId",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "LodgementDate",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "MatterTypeId",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "PrescriptionReminderStage",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "StatutoryNoticeDate",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "SummonsServedDate",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "SupervisorUserId",
                table: "Cases");
        }
    }
}
