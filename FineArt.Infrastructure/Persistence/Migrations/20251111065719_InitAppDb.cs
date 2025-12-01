using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FineArt.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitAppDb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Articles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Title = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Content = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ImageUrl = table.Column<string>(type: "varchar(2048)", maxLength: 2048, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ThumbnailUrl = table.Column<string>(type: "varchar(2048)", maxLength: 2048, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Writer = table.Column<string>(type: "varchar(128)", maxLength: 128, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Category = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Views = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Articles", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Artists",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Bio = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nationality = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ImageUrl = table.Column<string>(type: "varchar(1024)", maxLength: 1024, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Artists", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Exhibitions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Title = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Artist = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StartDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ImageUrl = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Location = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Category = table.Column<string>(type: "varchar(32)", maxLength: 32, nullable: false, defaultValue: "Group")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP(6)")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Exhibitions", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Email = table.Column<string>(type: "varchar(256)", maxLength: 256, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PasswordHash = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Role = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Artworks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Title = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Artist = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MainTheme = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SubTheme = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Size = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Material = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Price = table.Column<int>(type: "int", nullable: false),
                    IsRentable = table.Column<bool>(type: "bit(1)", nullable: false, defaultValue: false),
                    RentPrice = table.Column<int>(type: "int", nullable: true),
                    ImageUrl = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP(6)"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP(6)")
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.ComputedColumn),
                    ArtistId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Artworks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Artworks_Artists_ArtistId",
                        column: x => x.ArtistId,
                        principalTable: "Artists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.InsertData(
                table: "Artists",
                columns: new[] { "Id", "Bio", "CreatedAt", "ImageUrl", "Name", "Nationality" },
                values: new object[,]
                {
                    { 1001, "빛과 도시를 주제로 한 뉴미디어 설치·회화 작가.", new DateTime(2024, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80", "미나 허", "대한민국" },
                    { 1002, "물성과 색채 실험을 지속하는 2인 페인팅 그룹.", new DateTime(2024, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1475688621402-4257f5b911ef?auto=format&fit=crop&w=800&q=80", "라텍스 듀오", "대한민국" },
                    { 1003, "공간과 공감을 탐구하는 혼합재료 작가.", new DateTime(2024, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=800&q=80", "이수현", "대한민국" }
                });

            migrationBuilder.InsertData(
                table: "Exhibitions",
                columns: new[] { "Id", "Artist", "Category", "CreatedAt", "Description", "EndDate", "ImageUrl", "Location", "StartDate", "Title" },
                values: new object[,]
                {
                    { 1, "이수현", "Digital", new DateTime(2024, 12, 20, 0, 0, 0, 0, DateTimeKind.Utc), "디지털 확장 설치전. FineArt Cube 전체를 감싸는 몰입형 잉크 라이트 설치입니다.", new DateTime(2025, 6, 16, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=2000&q=80", "FineArt Cube", new DateTime(2025, 2, 15, 0, 0, 0, 0, DateTimeKind.Utc), "Void Ink · 여백의 잔상" },
                    { 2, "미나 허", "Group", new DateTime(2025, 1, 5, 0, 0, 0, 0, DateTimeKind.Utc), "미디어 회화전. OLED 페인트 패널과 투명 스크린으로 서울의 야경을 재해석합니다.", new DateTime(2025, 8, 30, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=2000&q=80", "FineArt Cube", new DateTime(2025, 4, 12, 0, 0, 0, 0, DateTimeKind.Utc), "Seoul Lightscape" },
                    { 3, "라텍스 듀오", "Installation", new DateTime(2025, 1, 22, 0, 0, 0, 0, DateTimeKind.Utc), "조명 작업전. 섬세한 석고 텍스처와 광섬유를 결합한 라텍스 듀오의 신작.", new DateTime(2025, 9, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1465311440653-ba9b1d68da21?auto=format&fit=crop&w=2000&q=80", "FineArt Gallery", new DateTime(2025, 5, 2, 0, 0, 0, 0, DateTimeKind.Utc), "Warm Mineral" }
                });

            migrationBuilder.InsertData(
                table: "Exhibitions",
                columns: new[] { "Id", "Artist", "CreatedAt", "Description", "EndDate", "ImageUrl", "Location", "StartDate", "Title" },
                values: new object[] { 4, "서이현", new DateTime(2025, 1, 28, 0, 0, 0, 0, DateTimeKind.Utc), "은은한 빛으로 숨 쉬는 인터랙티브 식물 설치. 관람자의 움직임에 따라 잎맥이 발광합니다.", new DateTime(2025, 7, 8, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=2000&q=80", "FineArt Green Room", new DateTime(2025, 3, 10, 0, 0, 0, 0, DateTimeKind.Utc), "Luminary Garden" });

            migrationBuilder.InsertData(
                table: "Exhibitions",
                columns: new[] { "Id", "Artist", "Category", "CreatedAt", "Description", "EndDate", "ImageUrl", "Location", "StartDate", "Title" },
                values: new object[,]
                {
                    { 5, "Collective Prism", "Group", new DateTime(2025, 2, 3, 0, 0, 0, 0, DateTimeKind.Utc), "수평선처럼 펼쳐지는 색면 미디어. 8K 레이어가 시간에 따라 서서히 이동합니다.", new DateTime(2025, 10, 4, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2000&q=80", "FineArt Cube", new DateTime(2025, 6, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Chromatic Drift" },
                    { 6, "이마루 & 윤채", "Group", new DateTime(2025, 2, 12, 0, 0, 0, 0, DateTimeKind.Utc), "도자기 조각 위에 프로젝션 맵핑을 입혀 소리와 색이 울리는 설치전.", new DateTime(2025, 9, 19, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=2000&q=80", "FineArt Atelier", new DateTime(2025, 4, 5, 0, 0, 0, 0, DateTimeKind.Utc), "Echoes of Clay" },
                    { 7, "Studio Nabile", "Digital", new DateTime(2025, 3, 8, 0, 0, 0, 0, DateTimeKind.Utc), "공간 전체를 사용하는 270도 홀로그램 연출과 클래식 사운드의 만남.", new DateTime(2026, 1, 12, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=2000&q=80", "FineArt Dome", new DateTime(2025, 8, 15, 0, 0, 0, 0, DateTimeKind.Utc), "Hologram Opera" }
                });

            migrationBuilder.InsertData(
                table: "Exhibitions",
                columns: new[] { "Id", "Artist", "CreatedAt", "Description", "EndDate", "ImageUrl", "Location", "StartDate", "Title" },
                values: new object[] { 8, "린다 베르그", new DateTime(2025, 4, 1, 0, 0, 0, 0, DateTimeKind.Utc), "극지방의 빛을 기록한 사진과 사운드 아카이브를 immersive 환경으로 재현.", new DateTime(2026, 2, 20, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2000&q=80", "FineArt Vault", new DateTime(2025, 9, 20, 0, 0, 0, 0, DateTimeKind.Utc), "Northbound Light" });

            migrationBuilder.InsertData(
                table: "Exhibitions",
                columns: new[] { "Id", "Artist", "Category", "CreatedAt", "Description", "EndDate", "ImageUrl", "Location", "StartDate", "Title" },
                values: new object[,]
                {
                    { 9, "Paper Assembly", "Installation", new DateTime(2025, 4, 10, 0, 0, 0, 0, DateTimeKind.Utc), "거대한 종이 구조물을 쌓아 도시 풍경을 재구성하는 설치 프로젝트.", new DateTime(2025, 11, 30, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=2000&q=80", "FineArt Warehouse", new DateTime(2025, 5, 18, 0, 0, 0, 0, DateTimeKind.Utc), "Paper Tectonics" },
                    { 10, "Co.studio Bloom", "Installation", new DateTime(2025, 4, 18, 0, 0, 0, 0, DateTimeKind.Utc), "향과 빛, 사운드를 결합해 계절의 변화를 체험하게 하는 몰입형 정원.", new DateTime(2025, 12, 5, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=2000&q=80", "FineArt Pavilion", new DateTime(2025, 7, 2, 0, 0, 0, 0, DateTimeKind.Utc), "Sensorial Bloom" },
                    { 11, "장도현", "Digital", new DateTime(2025, 5, 6, 0, 0, 0, 0, DateTimeKind.Utc), "레이저 스캔으로 기록한 도시의 잔상을 데이터 조각으로 시각화.", new DateTime(2026, 3, 14, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=2000&q=80", "FineArt Research Lab", new DateTime(2025, 10, 8, 0, 0, 0, 0, DateTimeKind.Utc), "Afterimage Waves" },
                    { 12, "FineArt Robot Lab", "Group", new DateTime(2025, 5, 20, 0, 0, 0, 0, DateTimeKind.Utc), "수장고에서 꺼낸 모듈 조각을 로봇 암으로 재배열하는 라이브 퍼포먼스.", new DateTime(2026, 4, 25, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1475688621402-4257a8543cfe?auto=format&fit=crop&w=2000&q=80", "FineArt Machine Room", new DateTime(2025, 11, 12, 0, 0, 0, 0, DateTimeKind.Utc), "Kinetic Archive" },
                    { 13, "Atmos Lab", "Installation", new DateTime(2025, 5, 28, 0, 0, 0, 0, DateTimeKind.Utc), "안개를 분사하는 대형 지도 구조와 프로젝션을 결합해 도시 기후를 표현.", new DateTime(2025, 9, 30, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=2000&q=80", "FineArt Plaza", new DateTime(2025, 6, 25, 0, 0, 0, 0, DateTimeKind.Utc), "Mist City Atlas" },
                    { 14, "Mira Collective", "Digital", new DateTime(2025, 6, 8, 0, 0, 0, 0, DateTimeKind.Utc), "수중 녹음을 재구성한 사운드 인스톨레이션과 빛의 파동 퍼포먼스.", new DateTime(2026, 5, 10, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1475694867812-f82b8696d610?auto=format&fit=crop&w=2000&q=80", "FineArt Hall B1", new DateTime(2025, 12, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Aquifer Chorus" }
                });

            migrationBuilder.InsertData(
                table: "Artworks",
                columns: new[] { "Id", "Artist", "ArtistId", "CreatedAt", "Description", "ImageUrl", "IsRentable", "MainTheme", "Material", "Price", "RentPrice", "Size", "Status", "SubTheme", "Title" },
                values: new object[] { 1, "미나 허", 1001, new DateTime(2024, 11, 5, 0, 0, 0, 0, DateTimeKind.Utc), "서울의 야경을 아크릴 레이어로 재해석한 시티 캔버스.", "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80", true, "풍경", "아크릴", 2900000, 480000, "91x117cm · 80호 이상", 2, "도시 조명", "Seoul Lightscape" });

            migrationBuilder.InsertData(
                table: "Artworks",
                columns: new[] { "Id", "Artist", "ArtistId", "CreatedAt", "Description", "ImageUrl", "MainTheme", "Material", "Price", "RentPrice", "Size", "Status", "SubTheme", "Title" },
                values: new object[,]
                {
                    { 2, "라텍스 듀오", 1002, new DateTime(2024, 11, 5, 0, 0, 0, 0, DateTimeKind.Utc), "광물성 안료가 겹겹이 쌓여 만들어낸 열감 있는 추상 회화.", "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80", "추상", "유화", 1800000, null, "73x91cm · 30호~50호", 0, "감각", "Warm Mineral" },
                    { 3, "이수현", 1003, new DateTime(2024, 11, 5, 0, 0, 0, 0, DateTimeKind.Utc), "잉크와 혼합재료로 공간감과 몰입을 강조한 시리즈.", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80", "상상", "혼합재료", 4200000, null, "100x100cm · 50호~80호", 0, "미래 공간", "Void Ink - Capsule" }
                });

            migrationBuilder.CreateIndex(
                name: "idx_articles_category",
                table: "Articles",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "idx_articles_created_at",
                table: "Articles",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "idx_artwork_created_at",
                table: "Artworks",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "idx_artwork_price",
                table: "Artworks",
                column: "Price");

            migrationBuilder.CreateIndex(
                name: "idx_artwork_status",
                table: "Artworks",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "idx_artwork_theme",
                table: "Artworks",
                column: "MainTheme");

            migrationBuilder.CreateIndex(
                name: "IX_Artworks_ArtistId",
                table: "Artworks",
                column: "ArtistId");

            migrationBuilder.CreateIndex(
                name: "idx_exhibitions_category",
                table: "Exhibitions",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "idx_exhibitions_schedule",
                table: "Exhibitions",
                column: "StartDate");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Articles");

            migrationBuilder.DropTable(
                name: "Artworks");

            migrationBuilder.DropTable(
                name: "Exhibitions");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Artists");
        }
    }
}
