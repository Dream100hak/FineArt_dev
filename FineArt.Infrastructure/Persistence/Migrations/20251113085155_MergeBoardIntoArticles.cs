using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FineArt.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MergeBoardIntoArticles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsBoard",
                table: "Articles",
                type: "bit(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql(
                """
                INSERT INTO Articles (Id, Title, Content, ImageUrl, ThumbnailUrl, Writer, Category, Views, CreatedAt, UpdatedAt, IsBoard)
                SELECT Id, Title, Content, '', '', Author, Category, Views, CreatedAt, UpdatedAt, 1
                FROM BoardPosts;
                """);

            migrationBuilder.DropTable(
                name: "BoardPosts");

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
                name: "IsBoard",
                table: "Articles");

            migrationBuilder.CreateTable(
                name: "BoardPosts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Author = table.Column<string>(type: "varchar(128)", maxLength: 128, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Category = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Content = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Title = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Views = table.Column<int>(type: "int", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardPosts", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.Sql(
                """
                INSERT INTO BoardPosts (Id, Title, Content, Author, Category, Views, CreatedAt, UpdatedAt)
                SELECT Id, Title, Content, Writer, Category, Views, CreatedAt, UpdatedAt
                FROM Articles
                WHERE IsBoard = 1;
                """);

            migrationBuilder.DropColumn(
                name: "IsBoard",
                table: "Articles");

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

            migrationBuilder.CreateIndex(
                name: "idx_board_posts_category",
                table: "BoardPosts",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "idx_board_posts_created_at",
                table: "BoardPosts",
                column: "CreatedAt");
        }
    }
}
