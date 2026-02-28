using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddOverallScoringFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<float>(
                name: "OverallPoints",
                table: "Finishes",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OverallRank",
                table: "Finishes",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OverallPoints",
                table: "Finishes");

            migrationBuilder.DropColumn(
                name: "OverallRank",
                table: "Finishes");
        }
    }
}
