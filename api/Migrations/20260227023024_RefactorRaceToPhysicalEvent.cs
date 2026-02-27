using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class RefactorRaceToPhysicalEvent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RaceNumber",
                table: "Races");

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Races",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "RaceNumber",
                table: "RaceFleets",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Name",
                table: "Races");

            migrationBuilder.DropColumn(
                name: "RaceNumber",
                table: "RaceFleets");

            migrationBuilder.AddColumn<int>(
                name: "RaceNumber",
                table: "Races",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
