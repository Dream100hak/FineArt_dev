using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FineArt.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddArtworkDimensions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "HeightCm",
                table: "Artworks",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SizeBucket",
                table: "Artworks",
                type: "varchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "WidthCm",
                table: "Artworks",
                type: "int",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "HeightCm", "SizeBucket", "WidthCm" },
                values: new object[] { null, "", null });

            migrationBuilder.UpdateData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "HeightCm", "SizeBucket", "WidthCm" },
                values: new object[] { null, "", null });

            migrationBuilder.UpdateData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "HeightCm", "SizeBucket", "WidthCm" },
                values: new object[] { null, "", null });

            migrationBuilder.UpdateData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "HeightCm", "SizeBucket", "WidthCm" },
                values: new object[] { null, "", null });

            migrationBuilder.UpdateData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "HeightCm", "SizeBucket", "WidthCm" },
                values: new object[] { null, "", null });

            migrationBuilder.UpdateData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "HeightCm", "SizeBucket", "WidthCm" },
                values: new object[] { null, "", null });

            migrationBuilder.UpdateData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "HeightCm", "SizeBucket", "WidthCm" },
                values: new object[] { null, "", null });

            migrationBuilder.UpdateData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "HeightCm", "SizeBucket", "WidthCm" },
                values: new object[] { null, "", null });

            migrationBuilder.UpdateData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "HeightCm", "SizeBucket", "WidthCm" },
                values: new object[] { null, "", null });

            migrationBuilder.UpdateData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "HeightCm", "SizeBucket", "WidthCm" },
                values: new object[] { null, "", null });

            migrationBuilder.UpdateData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 11,
                columns: new[] { "HeightCm", "SizeBucket", "WidthCm" },
                values: new object[] { null, "", null });

            migrationBuilder.UpdateData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "HeightCm", "SizeBucket", "WidthCm" },
                values: new object[] { null, "", null });

            migrationBuilder.UpdateData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 13,
                columns: new[] { "HeightCm", "SizeBucket", "WidthCm" },
                values: new object[] { null, "", null });

            migrationBuilder.UpdateData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 14,
                columns: new[] { "HeightCm", "SizeBucket", "WidthCm" },
                values: new object[] { null, "", null });

            migrationBuilder.UpdateData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 15,
                columns: new[] { "HeightCm", "SizeBucket", "WidthCm" },
                values: new object[] { null, "", null });

            migrationBuilder.UpdateData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 16,
                columns: new[] { "HeightCm", "SizeBucket", "WidthCm" },
                values: new object[] { null, "", null });

            migrationBuilder.UpdateData(
                table: "Exhibitions",
                keyColumn: "Id",
                keyValue: 4,
                column: "Category",
                value: "Group");

            migrationBuilder.UpdateData(
                table: "Exhibitions",
                keyColumn: "Id",
                keyValue: 8,
                column: "Category",
                value: "Group");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HeightCm",
                table: "Artworks");

            migrationBuilder.DropColumn(
                name: "SizeBucket",
                table: "Artworks");

            migrationBuilder.DropColumn(
                name: "WidthCm",
                table: "Artworks");

            migrationBuilder.UpdateData(
                table: "Exhibitions",
                keyColumn: "Id",
                keyValue: 4,
                column: "Category",
                value: "Solo");

            migrationBuilder.UpdateData(
                table: "Exhibitions",
                keyColumn: "Id",
                keyValue: 8,
                column: "Category",
                value: "Solo");
        }
    }
}
