using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateRaceFleetConfigurations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<float>(
                name: "CourseDistance",
                table: "RaceFleets",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CourseType",
                table: "RaceFleets",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ScoringParameters",
                table: "RaceFleets",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<float>(
                name: "WindDirection",
                table: "RaceFleets",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "WindSpeed",
                table: "RaceFleets",
                type: "real",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CourseDistance",
                table: "RaceFleets");

            migrationBuilder.DropColumn(
                name: "CourseType",
                table: "RaceFleets");

            migrationBuilder.DropColumn(
                name: "ScoringParameters",
                table: "RaceFleets");

            migrationBuilder.DropColumn(
                name: "WindDirection",
                table: "RaceFleets");

            migrationBuilder.DropColumn(
                name: "WindSpeed",
                table: "RaceFleets");
        }
    }
}
