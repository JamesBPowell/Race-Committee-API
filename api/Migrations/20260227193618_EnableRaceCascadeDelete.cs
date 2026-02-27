using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class EnableRaceCascadeDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Finishes_Races_RaceId",
                table: "Finishes");

            migrationBuilder.DropForeignKey(
                name: "FK_RaceFleets_Races_RaceId",
                table: "RaceFleets");

            migrationBuilder.AddForeignKey(
                name: "FK_Finishes_Races_RaceId",
                table: "Finishes",
                column: "RaceId",
                principalTable: "Races",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RaceFleets_Races_RaceId",
                table: "RaceFleets",
                column: "RaceId",
                principalTable: "Races",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Finishes_Races_RaceId",
                table: "Finishes");

            migrationBuilder.DropForeignKey(
                name: "FK_RaceFleets_Races_RaceId",
                table: "RaceFleets");

            migrationBuilder.AddForeignKey(
                name: "FK_Finishes_Races_RaceId",
                table: "Finishes",
                column: "RaceId",
                principalTable: "Races",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RaceFleets_Races_RaceId",
                table: "RaceFleets",
                column: "RaceId",
                principalTable: "Races",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
