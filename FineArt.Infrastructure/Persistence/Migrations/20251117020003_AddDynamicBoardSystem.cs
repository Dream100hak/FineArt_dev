using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FineArt.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDynamicBoardSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Writer",
                table: "Articles",
                type: "varchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(128)",
                oldMaxLength: 128)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "Articles",
                type: "varchar(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(500)",
                oldMaxLength: 500)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "ThumbnailUrl",
                table: "Articles",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(2048)",
                oldMaxLength: 2048)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "ImageUrl",
                table: "Articles",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(2048)",
                oldMaxLength: 2048)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "Category",
                table: "Articles",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(64)",
                oldMaxLength: 64)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "BoardTypeId",
                table: "Articles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Articles",
                type: "varchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "BoardTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Slug = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardTypes", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.InsertData(
                table: "BoardTypes",
                columns: new[] { "Id", "CreatedAt", "Description", "Name", "Slug", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "사이트 및 전시 관련 공지", "공지사항", "notice", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 2, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "사용자 자유 토론", "자유게시판", "free", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 3, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "예술 관련 뉴스", "뉴스", "news", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 4, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "미술 관련 채용 공고", "채용", "recruit", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 5, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "FineArt 주관 행사 소식", "전시/행사", "exhibition", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.Sql("UPDATE `Articles` SET `BoardTypeId` = 1 WHERE `BoardTypeId` = 0;");
            migrationBuilder.Sql("UPDATE `Articles` SET `Email` = CASE WHEN CHAR_LENGTH(`Email`) = 0 THEN CONCAT(`Writer`, '@legacy.local') ELSE `Email` END;");

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

            migrationBuilder.InsertData(
                table: "Articles",
                columns: new[] { "Id", "BoardTypeId", "Category", "Content", "CreatedAt", "Email", "ImageUrl", "ThumbnailUrl", "Title", "UpdatedAt", "Writer" },
                values: new object[,]
                {
                    { 90001, 1, null, "FineArt 시스템 점검이 예정되어 있습니다. 점검 시간 동안 일부 서비스 이용이 제한될 수 있습니다.", new DateTime(2025, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), "admin@fineart.local", null, null, "서버 점검 안내", new DateTime(2025, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), "관리자" },
                    { 90002, 3, null, "2025 서울 아트페어에 참가할 작가를 모집합니다.", new DateTime(2025, 1, 12, 0, 0, 0, 0, DateTimeKind.Utc), "news@fineart.local", null, null, "서울 아트페어 참가 공모", new DateTime(2025, 1, 12, 0, 0, 0, 0, DateTimeKind.Utc), "서울문화재단" },
                    { 90003, 5, null, "우하남 작가의 전시가 FineArt Cube에서 개최됩니다.", new DateTime(2025, 1, 15, 0, 0, 0, 0, DateTimeKind.Utc), "event@fineart.local", null, null, "우하남展 개최", new DateTime(2025, 1, 15, 0, 0, 0, 0, DateTimeKind.Utc), "FineArt" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Articles_BoardTypeId",
                table: "Articles",
                column: "BoardTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardTypes_Slug",
                table: "BoardTypes",
                column: "Slug",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Articles_BoardTypes_BoardTypeId",
                table: "Articles",
                column: "BoardTypeId",
                principalTable: "BoardTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Articles_BoardTypes_BoardTypeId",
                table: "Articles");

            migrationBuilder.DropTable(
                name: "BoardTypes");

            migrationBuilder.DropIndex(
                name: "IX_Articles_BoardTypeId",
                table: "Articles");

            migrationBuilder.DeleteData(
                table: "Articles",
                keyColumn: "Id",
                keyValue: 90001);

            migrationBuilder.DeleteData(
                table: "Articles",
                keyColumn: "Id",
                keyValue: 90002);

            migrationBuilder.DeleteData(
                table: "Articles",
                keyColumn: "Id",
                keyValue: 90003);

            migrationBuilder.DropColumn(
                name: "BoardTypeId",
                table: "Articles");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Articles");

            migrationBuilder.AlterColumn<string>(
                name: "Writer",
                table: "Articles",
                type: "varchar(128)",
                maxLength: 128,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(100)",
                oldMaxLength: 100)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "Articles",
                type: "varchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(255)",
                oldMaxLength: 255)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "Articles",
                keyColumn: "ThumbnailUrl",
                keyValue: null,
                column: "ThumbnailUrl",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "ThumbnailUrl",
                table: "Articles",
                type: "varchar(2048)",
                maxLength: 2048,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(500)",
                oldMaxLength: 500,
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "Articles",
                keyColumn: "ImageUrl",
                keyValue: null,
                column: "ImageUrl",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "ImageUrl",
                table: "Articles",
                type: "varchar(2048)",
                maxLength: 2048,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(500)",
                oldMaxLength: 500,
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "Articles",
                keyColumn: "Category",
                keyValue: null,
                column: "Category",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "Category",
                table: "Articles",
                type: "varchar(64)",
                maxLength: 64,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(100)",
                oldMaxLength: 100,
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<bool>(
                name: "IsBoard",
                table: "Articles",
                type: "bit(1)",
                nullable: false,
                defaultValue: false);

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
                name: "idx_articles_category",
                table: "Articles",
                column: "Category");
        }
    }
}
