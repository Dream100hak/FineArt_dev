using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FineArt.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCafeStyleBoards : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsVisible",
                table: "BoardTypes",
                type: "bit(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "LayoutType",
                table: "BoardTypes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "OrderIndex",
                table: "BoardTypes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ParentId",
                table: "BoardTypes",
                type: "int",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "BoardTypes",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "IsVisible", "LayoutType", "OrderIndex", "ParentId" },
                values: new object[] { true, 0, 0, null });

            migrationBuilder.UpdateData(
                table: "BoardTypes",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "IsVisible", "LayoutType", "OrderIndex", "ParentId" },
                values: new object[] { true, 0, 0, null });

            migrationBuilder.UpdateData(
                table: "BoardTypes",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "IsVisible", "LayoutType", "OrderIndex", "ParentId" },
                values: new object[] { true, 0, 0, null });

            migrationBuilder.UpdateData(
                table: "BoardTypes",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "IsVisible", "LayoutType", "OrderIndex", "ParentId" },
                values: new object[] { true, 0, 0, null });

            migrationBuilder.UpdateData(
                table: "BoardTypes",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "IsVisible", "LayoutType", "OrderIndex", "ParentId" },
                values: new object[] { true, 0, 0, null });

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
                name: "IsVisible",
                table: "BoardTypes");

            migrationBuilder.DropColumn(
                name: "LayoutType",
                table: "BoardTypes");

            migrationBuilder.DropColumn(
                name: "OrderIndex",
                table: "BoardTypes");

            migrationBuilder.DropColumn(
                name: "ParentId",
                table: "BoardTypes");

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
