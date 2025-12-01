using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FineArt.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddExhibitionHostAndParticipants : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Host",
                table: "Exhibitions",
                type: "varchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Participants",
                table: "Exhibitions",
                type: "longtext",
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "BoardTypes",
                keyColumn: "Id",
                keyValue: 1,
                column: "LayoutType",
                value: 2);

            migrationBuilder.UpdateData(
                table: "BoardTypes",
                keyColumn: "Id",
                keyValue: 2,
                column: "LayoutType",
                value: 2);

            migrationBuilder.UpdateData(
                table: "BoardTypes",
                keyColumn: "Id",
                keyValue: 3,
                column: "LayoutType",
                value: 2);

            migrationBuilder.UpdateData(
                table: "BoardTypes",
                keyColumn: "Id",
                keyValue: 4,
                column: "LayoutType",
                value: 2);

            migrationBuilder.UpdateData(
                table: "BoardTypes",
                keyColumn: "Id",
                keyValue: 5,
                column: "LayoutType",
                value: 2);

            migrationBuilder.UpdateData(
                table: "Exhibitions",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Host", "Participants" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "Exhibitions",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Host", "Participants" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "Exhibitions",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Host", "Participants" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "Exhibitions",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Host", "Participants" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "Exhibitions",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "Host", "Participants" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "Exhibitions",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "Host", "Participants" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "Exhibitions",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "Host", "Participants" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "Exhibitions",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "Host", "Participants" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "Exhibitions",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "Host", "Participants" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "Exhibitions",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "Host", "Participants" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "Exhibitions",
                keyColumn: "Id",
                keyValue: 11,
                columns: new[] { "Host", "Participants" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "Exhibitions",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "Host", "Participants" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "Exhibitions",
                keyColumn: "Id",
                keyValue: 13,
                columns: new[] { "Host", "Participants" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "Exhibitions",
                keyColumn: "Id",
                keyValue: 14,
                columns: new[] { "Host", "Participants" },
                values: new object[] { "", "" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Host",
                table: "Exhibitions");

            migrationBuilder.DropColumn(
                name: "Participants",
                table: "Exhibitions");

            migrationBuilder.UpdateData(
                table: "BoardTypes",
                keyColumn: "Id",
                keyValue: 1,
                column: "LayoutType",
                value: 0);

            migrationBuilder.UpdateData(
                table: "BoardTypes",
                keyColumn: "Id",
                keyValue: 2,
                column: "LayoutType",
                value: 0);

            migrationBuilder.UpdateData(
                table: "BoardTypes",
                keyColumn: "Id",
                keyValue: 3,
                column: "LayoutType",
                value: 0);

            migrationBuilder.UpdateData(
                table: "BoardTypes",
                keyColumn: "Id",
                keyValue: 4,
                column: "LayoutType",
                value: 0);

            migrationBuilder.UpdateData(
                table: "BoardTypes",
                keyColumn: "Id",
                keyValue: 5,
                column: "LayoutType",
                value: 0);
        }
    }
}
