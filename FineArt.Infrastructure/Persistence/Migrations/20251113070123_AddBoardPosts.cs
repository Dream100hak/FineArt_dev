using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FineArt.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBoardPosts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BoardPosts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Category = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Title = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Content = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Author = table.Column<string>(type: "varchar(128)", maxLength: 128, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Views = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardPosts", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.InsertData(
                table: "BoardPosts",
                columns: new[] { "Id", "Author", "Category", "Content", "CreatedAt", "Title", "UpdatedAt", "Views" },
                values: new object[,]
                {
                    { 9001, "neo", "공지", "FineArt Restoration 게시판 이용 시 유의사항을 안내드립니다. 1) 채용 정보 반복 등록 시 경고 조치, 2) 게시물 무단 복제/외부 전재 금지, 3) 미술문화와 무관한 도배형 게시물 등록 시 서비스 이용이 제한됩니다.", new DateTime(2025, 1, 15, 0, 0, 0, 0, DateTimeKind.Utc), "필독. FineArt 보드 운영 방침 안내", new DateTime(2025, 1, 15, 0, 0, 0, 0, DateTimeKind.Utc), 31430 },
                    { 9002, "성남문화재단", "채용", "성남아트센터 큐브플라자 전시 운영을 함께할 계약직 큐레이터를 모집합니다. 미술 관련 전공자 및 전시 기획 경험자를 우대하며, 2월 28일까지 fineart@snart.or.kr 로 이력서를 보내주세요.", new DateTime(2025, 2, 2, 0, 0, 0, 0, DateTimeKind.Utc), "[성남아트센터] 운영지원 계약직 큐레이터 채용", new DateTime(2025, 2, 2, 0, 0, 0, 0, DateTimeKind.Utc), 1686 },
                    { 9003, "인천서구문화재단", "전시/행사", "우하남 작가의 신작 드로잉 35점을 소개합니다. 인천서구문화센터 아트갤러리, 2월 15일 ~ 3월 5일. 오프닝 토크와 북사인회는 2월 15일 16:00에 진행됩니다.", new DateTime(2025, 2, 10, 0, 0, 0, 0, DateTimeKind.Utc), "우하남展 - 실패한 드로잉 / Failed Drawing", new DateTime(2025, 2, 10, 0, 0, 0, 0, DateTimeKind.Utc), 26680 },
                    { 9004, "서울문화재단", "뉴스", "독립 출판 작가 및 아트북 크리에이터를 대상으로 2025년 아트북페어 참가를 모집합니다. 참가 신청은 3월 20일까지 온라인으로 접수합니다.", new DateTime(2025, 2, 28, 0, 0, 0, 0, DateTimeKind.Utc), "서울 아트북페어 2025 참가 작가 공모", new DateTime(2025, 2, 28, 0, 0, 0, 0, DateTimeKind.Utc), 50332 },
                    { 9005, "박진선", "자유", "1990년대 인천 현대미술제 리플렛과 포스터를 보관하고 있습니다. 디지털화 프로젝트에 기증하고 싶어 연락처를 남깁니다.", new DateTime(2025, 3, 2, 0, 0, 0, 0, DateTimeKind.Utc), "아카이브 자료 기증 문의 드립니다", new DateTime(2025, 3, 2, 0, 0, 0, 0, DateTimeKind.Utc), 120 }
                });

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

            migrationBuilder.CreateIndex(
                name: "idx_board_posts_category",
                table: "BoardPosts",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "idx_board_posts_created_at",
                table: "BoardPosts",
                column: "CreatedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BoardPosts");

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
