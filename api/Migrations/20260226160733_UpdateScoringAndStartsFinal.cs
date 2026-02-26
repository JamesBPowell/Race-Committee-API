using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateScoringAndStartsFinal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<float>(
                name: "CourseDistance",
                table: "Races",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CourseType",
                table: "Races",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ScoringParameters",
                table: "Races",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "StartType",
                table: "Races",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<float>(
                name: "WindDirection",
                table: "Races",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "WindSpeed",
                table: "Races",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ScoringConfiguration",
                table: "Fleets",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "ScoringMethod",
                table: "Fleets",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Configuration",
                table: "Entries",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<float>(
                name: "Rating",
                table: "Entries",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RatingSnapshot",
                table: "Entries",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "RaceFleets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RaceId = table.Column<int>(type: "int", nullable: false),
                    FleetId = table.Column<int>(type: "int", nullable: false),
                    StartTimeOffset = table.Column<TimeSpan>(type: "time", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RaceFleets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RaceFleets_Fleets_FleetId",
                        column: x => x.FleetId,
                        principalTable: "Fleets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RaceFleets_Races_RaceId",
                        column: x => x.RaceId,
                        principalTable: "Races",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RaceFleets_FleetId",
                table: "RaceFleets",
                column: "FleetId");

            migrationBuilder.CreateIndex(
                name: "IX_RaceFleets_RaceId",
                table: "RaceFleets",
                column: "RaceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RaceFleets");

            migrationBuilder.DropColumn(
                name: "CourseDistance",
                table: "Races");

            migrationBuilder.DropColumn(
                name: "CourseType",
                table: "Races");

            migrationBuilder.DropColumn(
                name: "ScoringParameters",
                table: "Races");

            migrationBuilder.DropColumn(
                name: "StartType",
                table: "Races");

            migrationBuilder.DropColumn(
                name: "WindDirection",
                table: "Races");

            migrationBuilder.DropColumn(
                name: "WindSpeed",
                table: "Races");

            migrationBuilder.DropColumn(
                name: "ScoringConfiguration",
                table: "Fleets");

            migrationBuilder.DropColumn(
                name: "ScoringMethod",
                table: "Fleets");

            migrationBuilder.DropColumn(
                name: "Configuration",
                table: "Entries");

            migrationBuilder.DropColumn(
                name: "Rating",
                table: "Entries");

            migrationBuilder.DropColumn(
                name: "RatingSnapshot",
                table: "Entries");
        }
    }
}
