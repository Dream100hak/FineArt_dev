using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FineArt.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SeedAdditionalArtworks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Artists",
                columns: new[] { "Id", "Bio", "CreatedAt", "ImageUrl", "Name", "Nationality" },
                values: new object[,]
                {
                    { 1004, "도시 속 자연을 포착하는 수채 기반 작가.", new DateTime(2024, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80", "서현 리", "대한민국" },
                    { 1005, "사운드와 색을 결합한 추상 회화 실험자.", new DateTime(2024, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1462219184705-54ee45569803?auto=format&fit=crop&w=800&q=80", "이안 최", "대한민국" },
                    { 1006, "식물성과 감각을 섬세한 레이어로 확장한다.", new DateTime(2024, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80", "윤세라", "대한민국" },
                    { 1007, "도시 풍경을 시네마틱 색감으로 재해석.", new DateTime(2024, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=801&q=80", "루시 박", "대한민국" },
                    { 1008, "차분한 색면으로 빛의 변주를 연주하는 작가.", new DateTime(2024, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80", "김이노", "대한민국" },
                    { 1009, "우주적 상상력을 그래픽 라인으로 기록.", new DateTime(2024, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=801&q=80", "에바 장", "대한민국" },
                    { 1010, "대형 캔버스에서 조명과 음향을 회화화한다.", new DateTime(2024, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=802&q=80", "박유성", "대한민국" }
                });

            migrationBuilder.InsertData(
                table: "Artworks",
                columns: new[] { "Id", "Artist", "ArtistId", "CreatedAt", "Description", "ImageUrl", "MainTheme", "Material", "Price", "RentPrice", "Size", "Status", "SubTheme", "Title" },
                values: new object[] { 7, "미나 허", 1001, new DateTime(2024, 11, 5, 0, 0, 0, 0, DateTimeKind.Utc), "레이저 빛의 간격으로 만들어낸 지평선의 박동.", "https://images.unsplash.com/photo-1500534312200-a16b66c0f3b9?auto=format&fit=crop&w=1200&q=80", "풍경", "아크릴", 3400000, null, "100x60cm · 40호", 0, "지평선", "Horizon Pulse" });

            migrationBuilder.InsertData(
                table: "Artworks",
                columns: new[] { "Id", "Artist", "ArtistId", "CreatedAt", "Description", "ImageUrl", "IsRentable", "MainTheme", "Material", "Price", "RentPrice", "Size", "Status", "SubTheme", "Title" },
                values: new object[] { 11, "이수현", 1003, new DateTime(2024, 11, 5, 0, 0, 0, 0, DateTimeKind.Utc), "수중 생명체를 유리조각처럼 절제된 라인으로 묘사.", "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1100&q=80", true, "동물", "혼합재료", 1980000, 420000, "88x60cm · 25호", 2, "수중", "Glass Reef" });

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
                table: "Artworks",
                columns: new[] { "Id", "Artist", "ArtistId", "CreatedAt", "Description", "ImageUrl", "IsRentable", "MainTheme", "Material", "Price", "RentPrice", "Size", "Status", "SubTheme", "Title" },
                values: new object[] { 4, "서현 리", 1004, new DateTime(2024, 11, 5, 0, 0, 0, 0, DateTimeKind.Utc), "새벽빛을 머금은 작은 화병의 따스한 색감을 수채층으로 담았다.", "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1000&q=80", true, "정물", "수채", 620000, 150000, "45x53cm · 15호", 2, "플로럴", "Amber Bloom" });

            migrationBuilder.InsertData(
                table: "Artworks",
                columns: new[] { "Id", "Artist", "ArtistId", "CreatedAt", "Description", "ImageUrl", "MainTheme", "Material", "Price", "RentPrice", "Size", "Status", "SubTheme", "Title" },
                values: new object[] { 5, "이안 최", 1005, new DateTime(2024, 11, 5, 0, 0, 0, 0, DateTimeKind.Utc), "전자음과 파도 소리를 시각화한 네온 스트로크.", "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80", "상상", "혼합재료", 2800000, null, "120x80cm · 60호", 0, "사운드 파동", "Midnight Current" });

            migrationBuilder.InsertData(
                table: "Artworks",
                columns: new[] { "Id", "Artist", "ArtistId", "CreatedAt", "Description", "ImageUrl", "IsRentable", "MainTheme", "Material", "Price", "RentPrice", "Size", "Status", "SubTheme", "Title" },
                values: new object[] { 6, "윤세라", 1006, new DateTime(2024, 11, 5, 0, 0, 0, 0, DateTimeKind.Utc), "유리 온실 속 증기를 연두빛 레이어로 번지게 했다.", "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80", true, "정물", "아크릴", 1250000, 320000, "80x60cm · 25호", 2, "보타닉", "Botanic Whisper" });

            migrationBuilder.InsertData(
                table: "Artworks",
                columns: new[] { "Id", "Artist", "ArtistId", "CreatedAt", "Description", "ImageUrl", "MainTheme", "Material", "Price", "RentPrice", "Size", "Status", "SubTheme", "Title" },
                values: new object[] { 8, "이안 최", 1005, new DateTime(2024, 11, 5, 0, 0, 0, 0, DateTimeKind.Utc), "대양의 층위를 곡선 스트로크로 덧칠한 추상 회고록.", "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=81", "추상", "유화", 2050000, null, "91x91cm · 50호", 1, "해양", "Cerulean Memoir" });

            migrationBuilder.InsertData(
                table: "Artworks",
                columns: new[] { "Id", "Artist", "ArtistId", "CreatedAt", "Description", "ImageUrl", "IsRentable", "MainTheme", "Material", "Price", "RentPrice", "Size", "Status", "SubTheme", "Title" },
                values: new object[] { 9, "루시 박", 1007, new DateTime(2024, 11, 5, 0, 0, 0, 0, DateTimeKind.Utc), "해질녘 골목의 분홍빛 공기를 영화 스틸컷처럼 구현했다.", "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=81", true, "풍경", "아크릴", 1450000, 360000, "73x91cm · 30호~50호", 2, "도시 산책", "Dusty Pink Alley" });

            migrationBuilder.InsertData(
                table: "Artworks",
                columns: new[] { "Id", "Artist", "ArtistId", "CreatedAt", "Description", "ImageUrl", "MainTheme", "Material", "Price", "RentPrice", "Size", "Status", "SubTheme", "Title" },
                values: new object[] { 10, "김이노", 1008, new DateTime(2024, 11, 5, 0, 0, 0, 0, DateTimeKind.Utc), "밤 설원을 미드나잇 블루와 차콜 그라데이션으로 표현.", "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1100&q=80", "풍경", "유화", 3900000, null, "130x97cm · 80호 이상", 0, "설경", "Northern Quiet" });

            migrationBuilder.InsertData(
                table: "Artworks",
                columns: new[] { "Id", "Artist", "ArtistId", "CreatedAt", "Description", "ImageUrl", "IsRentable", "MainTheme", "Material", "Price", "RentPrice", "Size", "Status", "SubTheme", "Title" },
                values: new object[] { 12, "에바 장", 1009, new DateTime(2024, 11, 5, 0, 0, 0, 0, DateTimeKind.Utc), "궤도를 따라 움직이는 점과 선의 모션을 모노라인으로 기록.", "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1000&q=80", true, "상상", "드로잉", 780000, 190000, "60x60cm · 20호", 2, "우주", "Orbit Sketch" });

            migrationBuilder.InsertData(
                table: "Artworks",
                columns: new[] { "Id", "Artist", "ArtistId", "CreatedAt", "Description", "ImageUrl", "MainTheme", "Material", "Price", "RentPrice", "Size", "Status", "SubTheme", "Title" },
                values: new object[] { 13, "윤세라", 1006, new DateTime(2024, 11, 5, 0, 0, 0, 0, DateTimeKind.Utc), "깊은 녹색과 자주색을 벨벳처럼 번지게 한 정물 연작.", "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80", "정물", "오일파스텔", 1120000, null, "92x60cm · 30호", 1, "텍스타일", "Velvet Stillness" });

            migrationBuilder.InsertData(
                table: "Artworks",
                columns: new[] { "Id", "Artist", "ArtistId", "CreatedAt", "Description", "ImageUrl", "IsRentable", "MainTheme", "Material", "Price", "RentPrice", "Size", "Status", "SubTheme", "Title" },
                values: new object[] { 14, "박유성", 1010, new DateTime(2024, 11, 5, 0, 0, 0, 0, DateTimeKind.Utc), "공연장의 조명과 음향 파형을 다층 레이어로 시각화.", "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1300&q=80", true, "추상", "아크릴", 5400000, 720000, "162x112cm · 120호", 2, "공연장", "Luminous Stage" });

            migrationBuilder.InsertData(
                table: "Artworks",
                columns: new[] { "Id", "Artist", "ArtistId", "CreatedAt", "Description", "ImageUrl", "MainTheme", "Material", "Price", "RentPrice", "Size", "Status", "SubTheme", "Title" },
                values: new object[] { 15, "서현 리", 1004, new DateTime(2024, 11, 5, 0, 0, 0, 0, DateTimeKind.Utc), "햇살을 받아 분해되는 프리즘 정원을 색면으로 나눴다.", "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1150&q=80", "정물", "수채", 1650000, null, "80x100cm · 50호", 0, "정원", "Prism Garden" });

            migrationBuilder.InsertData(
                table: "Artworks",
                columns: new[] { "Id", "Artist", "ArtistId", "CreatedAt", "Description", "ImageUrl", "IsRentable", "MainTheme", "Material", "Price", "RentPrice", "Size", "Status", "SubTheme", "Title" },
                values: new object[] { 16, "김이노", 1008, new DateTime(2024, 11, 5, 0, 0, 0, 0, DateTimeKind.Utc), "라디오 노이즈와 새벽빛의 색조를 결합한 색면 회화.", "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1180&q=80", true, "추상", "유화", 2600000, 500000, "116x89cm · 60호", 0, "새벽", "Analog Dawn" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "Artworks",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "Artists",
                keyColumn: "Id",
                keyValue: 1004);

            migrationBuilder.DeleteData(
                table: "Artists",
                keyColumn: "Id",
                keyValue: 1005);

            migrationBuilder.DeleteData(
                table: "Artists",
                keyColumn: "Id",
                keyValue: 1006);

            migrationBuilder.DeleteData(
                table: "Artists",
                keyColumn: "Id",
                keyValue: 1007);

            migrationBuilder.DeleteData(
                table: "Artists",
                keyColumn: "Id",
                keyValue: 1008);

            migrationBuilder.DeleteData(
                table: "Artists",
                keyColumn: "Id",
                keyValue: 1009);

            migrationBuilder.DeleteData(
                table: "Artists",
                keyColumn: "Id",
                keyValue: 1010);

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
