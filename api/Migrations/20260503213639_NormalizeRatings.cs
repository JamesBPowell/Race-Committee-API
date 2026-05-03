using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeRatings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<float>(
                name: "NormalizedToD",
                table: "Certificates",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RatingType",
                table: "Certificates",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DefaultRatingType",
                table: "Boats",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NormalizedToD",
                table: "Certificates");

            migrationBuilder.DropColumn(
                name: "RatingType",
                table: "Certificates");

            migrationBuilder.DropColumn(
                name: "DefaultRatingType",
                table: "Boats");
        }
    }
}
