using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddFinishesAndScoringConfigs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Finishes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RaceId = table.Column<int>(type: "int", nullable: false),
                    EntryId = table.Column<int>(type: "int", nullable: false),
                    FinishTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ElapsedDuration = table.Column<TimeSpan>(type: "time", nullable: true),
                    CorrectedDuration = table.Column<TimeSpan>(type: "time", nullable: true),
                    TimePenalty = table.Column<TimeSpan>(type: "time", nullable: true),
                    Points = table.Column<float>(type: "real", nullable: true),
                    PointPenalty = table.Column<float>(type: "real", nullable: true),
                    Code = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Finishes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Finishes_Entries_EntryId",
                        column: x => x.EntryId,
                        principalTable: "Entries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Finishes_Races_RaceId",
                        column: x => x.RaceId,
                        principalTable: "Races",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Finishes_EntryId",
                table: "Finishes",
                column: "EntryId");

            migrationBuilder.CreateIndex(
                name: "IX_Finishes_RaceId",
                table: "Finishes",
                column: "RaceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Finishes");
        }
    }
}
