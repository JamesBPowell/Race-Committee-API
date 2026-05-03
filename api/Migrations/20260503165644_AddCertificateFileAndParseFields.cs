using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddCertificateFileAndParseFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "GPH",
                table: "Certificates",
                newName: "RatingSpinnaker");

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "Finishes",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "Finishes",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<string>(
                name: "BlobPath",
                table: "Certificates",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Configuration",
                table: "Certificates",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContentType",
                table: "Certificates",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FileName",
                table: "Certificates",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "FileSizeBytes",
                table: "Certificates",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FileUploadedAt",
                table: "Certificates",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ParseErrors",
                table: "Certificates",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ParseStatus",
                table: "Certificates",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<float>(
                name: "RatingNonSpinnaker",
                table: "Certificates",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SchemaVersion",
                table: "Certificates",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceHtml",
                table: "Certificates",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceSku",
                table: "Certificates",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceUrl",
                table: "Certificates",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BlobPath",
                table: "Certificates");

            migrationBuilder.DropColumn(
                name: "Configuration",
                table: "Certificates");

            migrationBuilder.DropColumn(
                name: "ContentType",
                table: "Certificates");

            migrationBuilder.DropColumn(
                name: "FileName",
                table: "Certificates");

            migrationBuilder.DropColumn(
                name: "FileSizeBytes",
                table: "Certificates");

            migrationBuilder.DropColumn(
                name: "FileUploadedAt",
                table: "Certificates");

            migrationBuilder.DropColumn(
                name: "ParseErrors",
                table: "Certificates");

            migrationBuilder.DropColumn(
                name: "ParseStatus",
                table: "Certificates");

            migrationBuilder.DropColumn(
                name: "RatingNonSpinnaker",
                table: "Certificates");

            migrationBuilder.DropColumn(
                name: "SchemaVersion",
                table: "Certificates");

            migrationBuilder.DropColumn(
                name: "SourceHtml",
                table: "Certificates");

            migrationBuilder.DropColumn(
                name: "SourceSku",
                table: "Certificates");

            migrationBuilder.DropColumn(
                name: "SourceUrl",
                table: "Certificates");

            migrationBuilder.RenameColumn(
                name: "RatingSpinnaker",
                table: "Certificates",
                newName: "GPH");

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "Finishes",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "Finishes",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);
        }
    }
}
