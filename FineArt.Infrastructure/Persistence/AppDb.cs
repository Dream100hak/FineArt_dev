using Microsoft.EntityFrameworkCore;
using FineArt.Domain;

namespace FineArt.Infrastructure.Persistence;

// EF Core DbContext
public class AppDb : DbContext
{
    public AppDb(DbContextOptions<AppDb> options) : base(options) { }

    public DbSet<Artwork> Artworks => Set<Artwork>();
    public DbSet<Artist> Artists => Set<Artist>();
    public DbSet<Article> Articles => Set<Article>();
    public DbSet<BoardType> BoardTypes => Set<BoardType>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Exhibition> Exhibitions => Set<Exhibition>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(builder =>
        {
            builder.HasIndex(u => u.Email).IsUnique();
            builder.Property(u => u.Email).HasMaxLength(256);
            builder.Property(u => u.Role).HasMaxLength(64);
        });

        modelBuilder.Entity<Artist>(builder =>
        {
            builder.Property(a => a.Name).HasMaxLength(200);
            builder.Property(a => a.Nationality).HasMaxLength(100);
            builder.Property(a => a.ImageUrl).HasMaxLength(1024);

            var artistSeedTimestamp = DateTime.SpecifyKind(new DateTime(2024, 11, 1), DateTimeKind.Utc);
            builder.HasData(
                new Artist
                {
                    Id = 1001,
                    Name = "미나 허",
                    Bio = "빛과 도시를 주제로 한 뉴미디어 설치·회화 작가.",
                    Nationality = "대한민국",
                    ImageUrl = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
                    CreatedAt = artistSeedTimestamp
                },
                new Artist
                {
                    Id = 1002,
                    Name = "라텍스 듀오",
                    Bio = "물성과 색채 실험을 지속하는 2인 페인팅 그룹.",
                    Nationality = "대한민국",
                    ImageUrl = "https://images.unsplash.com/photo-1475688621402-4257f5b911ef?auto=format&fit=crop&w=800&q=80",
                    CreatedAt = artistSeedTimestamp
                },
                new Artist
                {
                    Id = 1003,
                    Name = "이수현",
                    Bio = "공간과 공감을 탐구하는 혼합재료 작가.",
                    Nationality = "대한민국",
                    ImageUrl = "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=800&q=80",
                    CreatedAt = artistSeedTimestamp
                },
                new Artist
                {
                    Id = 1004,
                    Name = "서현 리",
                    Bio = "도시 속 자연을 포착하는 수채 기반 작가.",
                    Nationality = "대한민국",
                    ImageUrl = "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80",
                    CreatedAt = artistSeedTimestamp
                },
                new Artist
                {
                    Id = 1005,
                    Name = "이안 최",
                    Bio = "사운드와 색을 결합한 추상 회화 실험자.",
                    Nationality = "대한민국",
                    ImageUrl = "https://images.unsplash.com/photo-1462219184705-54ee45569803?auto=format&fit=crop&w=800&q=80",
                    CreatedAt = artistSeedTimestamp
                },
                new Artist
                {
                    Id = 1006,
                    Name = "윤세라",
                    Bio = "식물성과 감각을 섬세한 레이어로 확장한다.",
                    Nationality = "대한민국",
                    ImageUrl = "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80",
                    CreatedAt = artistSeedTimestamp
                },
                new Artist
                {
                    Id = 1007,
                    Name = "루시 박",
                    Bio = "도시 풍경을 시네마틱 색감으로 재해석.",
                    Nationality = "대한민국",
                    ImageUrl = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=801&q=80",
                    CreatedAt = artistSeedTimestamp
                },
                new Artist
                {
                    Id = 1008,
                    Name = "김이노",
                    Bio = "차분한 색면으로 빛의 변주를 연주하는 작가.",
                    Nationality = "대한민국",
                    ImageUrl = "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80",
                    CreatedAt = artistSeedTimestamp
                },
                new Artist
                {
                    Id = 1009,
                    Name = "에바 장",
                    Bio = "우주적 상상력을 그래픽 라인으로 기록.",
                    Nationality = "대한민국",
                    ImageUrl = "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=801&q=80",
                    CreatedAt = artistSeedTimestamp
                },
                new Artist
                {
                    Id = 1010,
                    Name = "박유성",
                    Bio = "대형 캔버스에서 조명과 음향을 회화화한다.",
                    Nationality = "대한민국",
                    ImageUrl = "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=802&q=80",
                    CreatedAt = artistSeedTimestamp
                });
        });

        modelBuilder.Entity<Artwork>(builder =>
        {
            builder.Property(a => a.Title).HasMaxLength(255).IsRequired();
            builder.Property(a => a.ArtistDisplayName)
                .HasColumnName("Artist")
                .HasMaxLength(255)
                .IsRequired();
            builder.Property(a => a.Description).HasColumnType("longtext");
            builder.Property(a => a.MainTheme).HasMaxLength(100);
            builder.Property(a => a.SubTheme).HasMaxLength(100);
            builder.Property(a => a.Size).HasMaxLength(100);
            builder.Property(a => a.WidthCm).HasColumnType("int").IsRequired(false);
            builder.Property(a => a.HeightCm).HasColumnType("int").IsRequired(false);
            builder.Property(a => a.SizeBucket).HasMaxLength(50);
            builder.Property(a => a.Material).HasMaxLength(100);
            builder.Property(a => a.ImageUrl).HasMaxLength(500);
            builder.Property(a => a.IsRentable).HasDefaultValue(false);
            builder.Property(a => a.RentPrice).HasColumnType("int");
            builder.Property(a => a.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP(6)");
            builder.Property(a => a.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP(6)")
                .ValueGeneratedOnAddOrUpdate();

            builder.HasIndex(a => a.Price).HasDatabaseName("idx_artwork_price");
            builder.HasIndex(a => a.CreatedAt).HasDatabaseName("idx_artwork_created_at");
            builder.HasIndex(a => a.MainTheme).HasDatabaseName("idx_artwork_theme");
            builder.HasIndex(a => a.Status).HasDatabaseName("idx_artwork_status");

            builder.HasOne(a => a.Artist)
                .WithMany(ar => ar.Artworks)
                .HasForeignKey(a => a.ArtistId)
                .OnDelete(DeleteBehavior.Cascade);

            var artworkSeedTimestamp = DateTime.SpecifyKind(new DateTime(2024, 11, 5), DateTimeKind.Utc);
            builder.HasData(
                new Artwork
                {
                    Id = 1,
                    Title = "Seoul Lightscape",
                    ArtistId = 1001,
                    ArtistDisplayName = "미나 허",
                    Description = "서울의 야경을 아크릴 레이어로 재해석한 시티 캔버스.",
                    MainTheme = "풍경",
                    SubTheme = "도시 조명",
                    Size = "91x117cm · 80호 이상",
                    Material = "아크릴",
                    Price = 2_900_000,
                    IsRentable = true,
                    RentPrice = 480_000,
                    ImageUrl = "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80",
                    Status = ArtworkStatus.Rentable,
                    CreatedAt = artworkSeedTimestamp,
                    UpdatedAt = artworkSeedTimestamp
                },
                new Artwork
                {
                    Id = 2,
                    Title = "Warm Mineral",
                    ArtistId = 1002,
                    ArtistDisplayName = "라텍스 듀오",
                    Description = "광물성 안료가 겹겹이 쌓여 만들어낸 열감 있는 추상 회화.",
                    MainTheme = "추상",
                    SubTheme = "감각",
                    Size = "73x91cm · 30호~50호",
                    Material = "유화",
                    Price = 1_800_000,
                    IsRentable = false,
                    RentPrice = null,
                    ImageUrl = "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80",
                    Status = ArtworkStatus.ForSale,
                    CreatedAt = artworkSeedTimestamp,
                    UpdatedAt = artworkSeedTimestamp
                },
                new Artwork
                {
                    Id = 3,
                    Title = "Void Ink - Capsule",
                    ArtistId = 1003,
                    ArtistDisplayName = "이수현",
                    Description = "잉크와 혼합재료로 공간감과 몰입을 강조한 시리즈.",
                    MainTheme = "상상",
                    SubTheme = "미래 공간",
                    Size = "100x100cm · 50호~80호",
                    Material = "혼합재료",
                    Price = 4_200_000,
                    IsRentable = false,
                    RentPrice = null,
                    ImageUrl = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
                    Status = ArtworkStatus.ForSale,
                    CreatedAt = artworkSeedTimestamp,
                    UpdatedAt = artworkSeedTimestamp
                },
                new Artwork
                {
                    Id = 4,
                    Title = "Amber Bloom",
                    ArtistId = 1004,
                    ArtistDisplayName = "서현 리",
                    Description = "새벽빛을 머금은 작은 화병의 따스한 색감을 수채층으로 담았다.",
                    MainTheme = "정물",
                    SubTheme = "플로럴",
                    Size = "45x53cm · 15호",
                    Material = "수채",
                    Price = 620_000,
                    IsRentable = true,
                    RentPrice = 150_000,
                    ImageUrl = "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1000&q=80",
                    Status = ArtworkStatus.Rentable,
                    CreatedAt = artworkSeedTimestamp,
                    UpdatedAt = artworkSeedTimestamp
                },
                new Artwork
                {
                    Id = 5,
                    Title = "Midnight Current",
                    ArtistId = 1005,
                    ArtistDisplayName = "이안 최",
                    Description = "전자음과 파도 소리를 시각화한 네온 스트로크.",
                    MainTheme = "상상",
                    SubTheme = "사운드 파동",
                    Size = "120x80cm · 60호",
                    Material = "혼합재료",
                    Price = 2_800_000,
                    IsRentable = false,
                    RentPrice = null,
                    ImageUrl = "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
                    Status = ArtworkStatus.ForSale,
                    CreatedAt = artworkSeedTimestamp,
                    UpdatedAt = artworkSeedTimestamp
                },
                new Artwork
                {
                    Id = 6,
                    Title = "Botanic Whisper",
                    ArtistId = 1006,
                    ArtistDisplayName = "윤세라",
                    Description = "유리 온실 속 증기를 연두빛 레이어로 번지게 했다.",
                    MainTheme = "정물",
                    SubTheme = "보타닉",
                    Size = "80x60cm · 25호",
                    Material = "아크릴",
                    Price = 1_250_000,
                    IsRentable = true,
                    RentPrice = 320_000,
                    ImageUrl = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
                    Status = ArtworkStatus.Rentable,
                    CreatedAt = artworkSeedTimestamp,
                    UpdatedAt = artworkSeedTimestamp
                },
                new Artwork
                {
                    Id = 7,
                    Title = "Horizon Pulse",
                    ArtistId = 1001,
                    ArtistDisplayName = "미나 허",
                    Description = "레이저 빛의 간격으로 만들어낸 지평선의 박동.",
                    MainTheme = "풍경",
                    SubTheme = "지평선",
                    Size = "100x60cm · 40호",
                    Material = "아크릴",
                    Price = 3_400_000,
                    IsRentable = false,
                    RentPrice = null,
                    ImageUrl = "https://images.unsplash.com/photo-1500534312200-a16b66c0f3b9?auto=format&fit=crop&w=1200&q=80",
                    Status = ArtworkStatus.ForSale,
                    CreatedAt = artworkSeedTimestamp,
                    UpdatedAt = artworkSeedTimestamp
                },
                new Artwork
                {
                    Id = 8,
                    Title = "Cerulean Memoir",
                    ArtistId = 1005,
                    ArtistDisplayName = "이안 최",
                    Description = "대양의 층위를 곡선 스트로크로 덧칠한 추상 회고록.",
                    MainTheme = "추상",
                    SubTheme = "해양",
                    Size = "91x91cm · 50호",
                    Material = "유화",
                    Price = 2_050_000,
                    IsRentable = false,
                    RentPrice = null,
                    ImageUrl = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=81",
                    Status = ArtworkStatus.Sold,
                    CreatedAt = artworkSeedTimestamp,
                    UpdatedAt = artworkSeedTimestamp
                },
                new Artwork
                {
                    Id = 9,
                    Title = "Dusty Pink Alley",
                    ArtistId = 1007,
                    ArtistDisplayName = "루시 박",
                    Description = "해질녘 골목의 분홍빛 공기를 영화 스틸컷처럼 구현했다.",
                    MainTheme = "풍경",
                    SubTheme = "도시 산책",
                    Size = "73x91cm · 30호~50호",
                    Material = "아크릴",
                    Price = 1_450_000,
                    IsRentable = true,
                    RentPrice = 360_000,
                    ImageUrl = "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=81",
                    Status = ArtworkStatus.Rentable,
                    CreatedAt = artworkSeedTimestamp,
                    UpdatedAt = artworkSeedTimestamp
                },
                new Artwork
                {
                    Id = 10,
                    Title = "Northern Quiet",
                    ArtistId = 1008,
                    ArtistDisplayName = "김이노",
                    Description = "밤 설원을 미드나잇 블루와 차콜 그라데이션으로 표현.",
                    MainTheme = "풍경",
                    SubTheme = "설경",
                    Size = "130x97cm · 80호 이상",
                    Material = "유화",
                    Price = 3_900_000,
                    IsRentable = false,
                    RentPrice = null,
                    ImageUrl = "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1100&q=80",
                    Status = ArtworkStatus.ForSale,
                    CreatedAt = artworkSeedTimestamp,
                    UpdatedAt = artworkSeedTimestamp
                },
                new Artwork
                {
                    Id = 11,
                    Title = "Glass Reef",
                    ArtistId = 1003,
                    ArtistDisplayName = "이수현",
                    Description = "수중 생명체를 유리조각처럼 절제된 라인으로 묘사.",
                    MainTheme = "동물",
                    SubTheme = "수중",
                    Size = "88x60cm · 25호",
                    Material = "혼합재료",
                    Price = 1_980_000,
                    IsRentable = true,
                    RentPrice = 420_000,
                    ImageUrl = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1100&q=80",
                    Status = ArtworkStatus.Rentable,
                    CreatedAt = artworkSeedTimestamp,
                    UpdatedAt = artworkSeedTimestamp
                },
                new Artwork
                {
                    Id = 12,
                    Title = "Orbit Sketch",
                    ArtistId = 1009,
                    ArtistDisplayName = "에바 장",
                    Description = "궤도를 따라 움직이는 점과 선의 모션을 모노라인으로 기록.",
                    MainTheme = "상상",
                    SubTheme = "우주",
                    Size = "60x60cm · 20호",
                    Material = "드로잉",
                    Price = 780_000,
                    IsRentable = true,
                    RentPrice = 190_000,
                    ImageUrl = "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1000&q=80",
                    Status = ArtworkStatus.Rentable,
                    CreatedAt = artworkSeedTimestamp,
                    UpdatedAt = artworkSeedTimestamp
                },
                new Artwork
                {
                    Id = 13,
                    Title = "Velvet Stillness",
                    ArtistId = 1006,
                    ArtistDisplayName = "윤세라",
                    Description = "깊은 녹색과 자주색을 벨벳처럼 번지게 한 정물 연작.",
                    MainTheme = "정물",
                    SubTheme = "텍스타일",
                    Size = "92x60cm · 30호",
                    Material = "오일파스텔",
                    Price = 1_120_000,
                    IsRentable = false,
                    RentPrice = null,
                    ImageUrl = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80",
                    Status = ArtworkStatus.Sold,
                    CreatedAt = artworkSeedTimestamp,
                    UpdatedAt = artworkSeedTimestamp
                },
                new Artwork
                {
                    Id = 14,
                    Title = "Luminous Stage",
                    ArtistId = 1010,
                    ArtistDisplayName = "박유성",
                    Description = "공연장의 조명과 음향 파형을 다층 레이어로 시각화.",
                    MainTheme = "추상",
                    SubTheme = "공연장",
                    Size = "162x112cm · 120호",
                    Material = "아크릴",
                    Price = 5_400_000,
                    IsRentable = true,
                    RentPrice = 720_000,
                    ImageUrl = "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1300&q=80",
                    Status = ArtworkStatus.Rentable,
                    CreatedAt = artworkSeedTimestamp,
                    UpdatedAt = artworkSeedTimestamp
                },
                new Artwork
                {
                    Id = 15,
                    Title = "Prism Garden",
                    ArtistId = 1004,
                    ArtistDisplayName = "서현 리",
                    Description = "햇살을 받아 분해되는 프리즘 정원을 색면으로 나눴다.",
                    MainTheme = "정물",
                    SubTheme = "정원",
                    Size = "80x100cm · 50호",
                    Material = "수채",
                    Price = 1_650_000,
                    IsRentable = false,
                    RentPrice = null,
                    ImageUrl = "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1150&q=80",
                    Status = ArtworkStatus.ForSale,
                    CreatedAt = artworkSeedTimestamp,
                    UpdatedAt = artworkSeedTimestamp
                },
                new Artwork
                {
                    Id = 16,
                    Title = "Analog Dawn",
                    ArtistId = 1008,
                    ArtistDisplayName = "김이노",
                    Description = "라디오 노이즈와 새벽빛의 색조를 결합한 색면 회화.",
                    MainTheme = "추상",
                    SubTheme = "새벽",
                    Size = "116x89cm · 60호",
                    Material = "유화",
                    Price = 2_600_000,
                    IsRentable = true,
                    RentPrice = 500_000,
                    ImageUrl = "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1180&q=80",
                    Status = ArtworkStatus.ForSale,
                    CreatedAt = artworkSeedTimestamp,
                    UpdatedAt = artworkSeedTimestamp
                });
        });

        modelBuilder.Entity<BoardType>(builder =>
        {
            builder.Property(b => b.Name).HasMaxLength(100).IsRequired();
            builder.Property(b => b.Slug).HasMaxLength(100).IsRequired();
            builder.Property(b => b.Description).HasMaxLength(255);
            builder.HasIndex(b => b.Slug).IsUnique();

            var boardSeedTimestamp = DateTime.SpecifyKind(new DateTime(2025, 1, 1), DateTimeKind.Utc);

            builder.HasData(
                new BoardType { Id = 1, Name = "공지사항", Slug = "notice", Description = "사이트 및 전시 관련 공지", CreatedAt = boardSeedTimestamp, UpdatedAt = boardSeedTimestamp },
                new BoardType { Id = 2, Name = "자유게시판", Slug = "free", Description = "사용자 자유 토론", CreatedAt = boardSeedTimestamp, UpdatedAt = boardSeedTimestamp },
                new BoardType { Id = 3, Name = "뉴스", Slug = "news", Description = "예술 관련 뉴스", CreatedAt = boardSeedTimestamp, UpdatedAt = boardSeedTimestamp },
                new BoardType { Id = 4, Name = "채용", Slug = "recruit", Description = "미술 관련 채용 공고", CreatedAt = boardSeedTimestamp, UpdatedAt = boardSeedTimestamp },
                new BoardType { Id = 5, Name = "전시/행사", Slug = "exhibition", Description = "FineArt 주관 행사 소식", CreatedAt = boardSeedTimestamp, UpdatedAt = boardSeedTimestamp }
            );
        });

        modelBuilder.Entity<Article>(builder =>
        {
            builder.Property(a => a.Title).HasMaxLength(255).IsRequired();
            builder.Property(a => a.Writer).HasMaxLength(100).IsRequired();
            builder.Property(a => a.Email).HasMaxLength(255).IsRequired();
            builder.Property(a => a.Category).HasMaxLength(100);
            builder.Property(a => a.ImageUrl).HasMaxLength(500);
            builder.Property(a => a.ThumbnailUrl).HasMaxLength(500);
            builder.Property(a => a.Views).HasDefaultValue(0);
            builder.HasIndex(a => a.CreatedAt).HasDatabaseName("idx_articles_created_at");
            builder.HasOne(a => a.BoardType)
                .WithMany(b => b.Articles)
                .HasForeignKey(a => a.BoardTypeId)
                .OnDelete(DeleteBehavior.Cascade);

            var articleSeedTimestamp = DateTime.SpecifyKind(new DateTime(2025, 1, 10), DateTimeKind.Utc);

            builder.HasData(
                new Article
                {
                    Id = 90001,
                    BoardTypeId = 1,
                    Title = "서버 점검 안내",
                    Content = "FineArt 시스템 점검이 예정되어 있습니다. 점검 시간 동안 일부 서비스 이용이 제한될 수 있습니다.",
                    Writer = "관리자",
                    Email = "admin@fineart.local",
                    Views = 0,
                    CreatedAt = articleSeedTimestamp,
                    UpdatedAt = articleSeedTimestamp
                },
                new Article
                {
                    Id = 90002,
                    BoardTypeId = 3,
                    Title = "서울 아트페어 참가 공모",
                    Content = "2025 서울 아트페어에 참가할 작가를 모집합니다.",
                    Writer = "서울문화재단",
                    Email = "news@fineart.local",
                    Views = 0,
                    CreatedAt = articleSeedTimestamp.AddDays(2),
                    UpdatedAt = articleSeedTimestamp.AddDays(2)
                },
                new Article
                {
                    Id = 90003,
                    BoardTypeId = 5,
                    Title = "우하남展 개최",
                    Content = "우하남 작가의 전시가 FineArt Cube에서 개최됩니다.",
                    Writer = "FineArt",
                    Email = "event@fineart.local",
                    Views = 0,
                    CreatedAt = articleSeedTimestamp.AddDays(5),
                    UpdatedAt = articleSeedTimestamp.AddDays(5)
                });
        });

        modelBuilder.Entity<Exhibition>(builder =>
        {
            builder.Property(e => e.Title).HasMaxLength(255).IsRequired();
            builder.Property(e => e.Artist).HasMaxLength(255).IsRequired();
            builder.Property(e => e.Host).HasMaxLength(255).HasDefaultValue(string.Empty);
            builder.Property(e => e.Participants).HasColumnType("longtext").HasDefaultValue(string.Empty);
            builder.Property(e => e.Location).HasMaxLength(255).IsRequired();
            builder.Property(e => e.ImageUrl).HasMaxLength(500);
            builder.Property(e => e.Description).HasColumnType("longtext");
            builder.Property(e => e.Category)
                .HasConversion<string>()
                .HasMaxLength(32)
                .HasDefaultValue(ExhibitionCategory.Group);
            builder.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP(6)");

            builder.HasIndex(e => e.Category).HasDatabaseName("idx_exhibitions_category");
            builder.HasIndex(e => e.StartDate).HasDatabaseName("idx_exhibitions_schedule");

            builder.HasData(
                new Exhibition
                {
                    Id = 1,
                    Title = "Void Ink · 여백의 잔상",
                    Description = "디지털 확장 설치전. FineArt Cube 전체를 감싸는 몰입형 잉크 라이트 설치입니다.",
                    Artist = "이수현",
                    Host = string.Empty,
                    Participants = string.Empty,
                    Location = "FineArt Cube",
                    StartDate = DateTime.SpecifyKind(new DateTime(2025, 2, 15), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(new DateTime(2025, 6, 16), DateTimeKind.Utc),
                    ImageUrl = "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=2000&q=80",
                    Category = ExhibitionCategory.Digital,
                    CreatedAt = DateTime.SpecifyKind(new DateTime(2024, 12, 20), DateTimeKind.Utc)
                },
                new Exhibition
                {
                    Id = 2,
                    Title = "Seoul Lightscape",
                    Description = "미디어 회화전. OLED 페인트 패널과 투명 스크린으로 서울의 야경을 재해석합니다.",
                    Artist = "미나 허",
                    Host = string.Empty,
                    Participants = string.Empty,
                    Location = "FineArt Cube",
                    StartDate = DateTime.SpecifyKind(new DateTime(2025, 4, 12), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(new DateTime(2025, 8, 30), DateTimeKind.Utc),
                    ImageUrl = "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=2000&q=80",
                    Category = ExhibitionCategory.Group,
                    CreatedAt = DateTime.SpecifyKind(new DateTime(2025, 1, 5), DateTimeKind.Utc)
                },
                new Exhibition
                {
                    Id = 3,
                    Title = "Warm Mineral",
                    Description = "조명 작업전. 섬세한 석고 텍스처와 광섬유를 결합한 라텍스 듀오의 신작.",
                    Artist = "라텍스 듀오",
                    Host = string.Empty,
                    Participants = string.Empty,
                    Location = "FineArt Gallery",
                    StartDate = DateTime.SpecifyKind(new DateTime(2025, 5, 2), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(new DateTime(2025, 9, 1), DateTimeKind.Utc),
                    ImageUrl = "https://images.unsplash.com/photo-1465311440653-ba9b1d68da21?auto=format&fit=crop&w=2000&q=80",
                    Category = ExhibitionCategory.Installation,
                    CreatedAt = DateTime.SpecifyKind(new DateTime(2025, 1, 22), DateTimeKind.Utc)
                },
                new Exhibition
                {
                    Id = 4,
                    Title = "Luminary Garden",
                    Description = "은은한 빛으로 숨 쉬는 인터랙티브 식물 설치. 관람자의 움직임에 따라 잎맥이 발광합니다.",
                    Artist = "서이현",
                    Host = string.Empty,
                    Participants = string.Empty,
                    Location = "FineArt Green Room",
                    StartDate = DateTime.SpecifyKind(new DateTime(2025, 3, 10), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(new DateTime(2025, 7, 8), DateTimeKind.Utc),
                    ImageUrl = "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=2000&q=80",
                    Category = ExhibitionCategory.Solo,
                    CreatedAt = DateTime.SpecifyKind(new DateTime(2025, 1, 28), DateTimeKind.Utc)
                },
                new Exhibition
                {
                    Id = 5,
                    Title = "Chromatic Drift",
                    Description = "수평선처럼 펼쳐지는 색면 미디어. 8K 레이어가 시간에 따라 서서히 이동합니다.",
                    Artist = "Collective Prism",
                    Host = string.Empty,
                    Participants = string.Empty,
                    Location = "FineArt Cube",
                    StartDate = DateTime.SpecifyKind(new DateTime(2025, 6, 1), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(new DateTime(2025, 10, 4), DateTimeKind.Utc),
                    ImageUrl = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2000&q=80",
                    Category = ExhibitionCategory.Group,
                    CreatedAt = DateTime.SpecifyKind(new DateTime(2025, 2, 3), DateTimeKind.Utc)
                },
                new Exhibition
                {
                    Id = 6,
                    Title = "Echoes of Clay",
                    Description = "도자기 조각 위에 프로젝션 맵핑을 입혀 소리와 색이 울리는 설치전.",
                    Artist = "이마루 & 윤채",
                    Host = string.Empty,
                    Participants = string.Empty,
                    Location = "FineArt Atelier",
                    StartDate = DateTime.SpecifyKind(new DateTime(2025, 4, 5), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(new DateTime(2025, 9, 19), DateTimeKind.Utc),
                    ImageUrl = "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=2000&q=80",
                    Category = ExhibitionCategory.Group,
                    CreatedAt = DateTime.SpecifyKind(new DateTime(2025, 2, 12), DateTimeKind.Utc)
                },
                new Exhibition
                {
                    Id = 7,
                    Title = "Hologram Opera",
                    Description = "공간 전체를 사용하는 270도 홀로그램 연출과 클래식 사운드의 만남.",
                    Artist = "Studio Nabile",
                    Host = string.Empty,
                    Participants = string.Empty,
                    Location = "FineArt Dome",
                    StartDate = DateTime.SpecifyKind(new DateTime(2025, 8, 15), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(new DateTime(2026, 1, 12), DateTimeKind.Utc),
                    ImageUrl = "https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=2000&q=80",
                    Category = ExhibitionCategory.Digital,
                    CreatedAt = DateTime.SpecifyKind(new DateTime(2025, 3, 8), DateTimeKind.Utc)
                },
                new Exhibition
                {
                    Id = 8,
                    Title = "Northbound Light",
                    Description = "극지방의 빛을 기록한 사진과 사운드 아카이브를 immersive 환경으로 재현.",
                    Artist = "린다 베르그",
                    Host = string.Empty,
                    Participants = string.Empty,
                    Location = "FineArt Vault",
                    StartDate = DateTime.SpecifyKind(new DateTime(2025, 9, 20), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(new DateTime(2026, 2, 20), DateTimeKind.Utc),
                    ImageUrl = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2000&q=80",
                    Category = ExhibitionCategory.Solo,
                    CreatedAt = DateTime.SpecifyKind(new DateTime(2025, 4, 1), DateTimeKind.Utc)
                },
                new Exhibition
                {
                    Id = 9,
                    Title = "Paper Tectonics",
                    Description = "거대한 종이 구조물을 쌓아 도시 풍경을 재구성하는 설치 프로젝트.",
                    Artist = "Paper Assembly",
                    Host = string.Empty,
                    Participants = string.Empty,
                    Location = "FineArt Warehouse",
                    StartDate = DateTime.SpecifyKind(new DateTime(2025, 5, 18), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(new DateTime(2025, 11, 30), DateTimeKind.Utc),
                    ImageUrl = "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=2000&q=80",
                    Category = ExhibitionCategory.Installation,
                    CreatedAt = DateTime.SpecifyKind(new DateTime(2025, 4, 10), DateTimeKind.Utc)
                },
                new Exhibition
                {
                    Id = 10,
                    Title = "Sensorial Bloom",
                    Description = "향과 빛, 사운드를 결합해 계절의 변화를 체험하게 하는 몰입형 정원.",
                    Artist = "Co.studio Bloom",
                    Host = string.Empty,
                    Participants = string.Empty,
                    Location = "FineArt Pavilion",
                    StartDate = DateTime.SpecifyKind(new DateTime(2025, 7, 2), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(new DateTime(2025, 12, 5), DateTimeKind.Utc),
                    ImageUrl = "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=2000&q=80",
                    Category = ExhibitionCategory.Installation,
                    CreatedAt = DateTime.SpecifyKind(new DateTime(2025, 4, 18), DateTimeKind.Utc)
                },
                new Exhibition
                {
                    Id = 11,
                    Title = "Afterimage Waves",
                    Description = "레이저 스캔으로 기록한 도시의 잔상을 데이터 조각으로 시각화.",
                    Artist = "장도현",
                    Host = string.Empty,
                    Participants = string.Empty,
                    Location = "FineArt Research Lab",
                    StartDate = DateTime.SpecifyKind(new DateTime(2025, 10, 8), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(new DateTime(2026, 3, 14), DateTimeKind.Utc),
                    ImageUrl = "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=2000&q=80",
                    Category = ExhibitionCategory.Digital,
                    CreatedAt = DateTime.SpecifyKind(new DateTime(2025, 5, 6), DateTimeKind.Utc)
                },
                new Exhibition
                {
                    Id = 12,
                    Title = "Kinetic Archive",
                    Description = "수장고에서 꺼낸 모듈 조각을 로봇 암으로 재배열하는 라이브 퍼포먼스.",
                    Artist = "FineArt Robot Lab",
                    Host = string.Empty,
                    Participants = string.Empty,
                    Location = "FineArt Machine Room",
                    StartDate = DateTime.SpecifyKind(new DateTime(2025, 11, 12), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(new DateTime(2026, 4, 25), DateTimeKind.Utc),
                    ImageUrl = "https://images.unsplash.com/photo-1475688621402-4257a8543cfe?auto=format&fit=crop&w=2000&q=80",
                    Category = ExhibitionCategory.Group,
                    CreatedAt = DateTime.SpecifyKind(new DateTime(2025, 5, 20), DateTimeKind.Utc)
                },
                new Exhibition
                {
                    Id = 13,
                    Title = "Mist City Atlas",
                    Description = "안개를 분사하는 대형 지도 구조와 프로젝션을 결합해 도시 기후를 표현.",
                    Artist = "Atmos Lab",
                    Host = string.Empty,
                    Participants = string.Empty,
                    Location = "FineArt Plaza",
                    StartDate = DateTime.SpecifyKind(new DateTime(2025, 6, 25), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(new DateTime(2025, 9, 30), DateTimeKind.Utc),
                    ImageUrl = "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=2000&q=80",
                    Category = ExhibitionCategory.Installation,
                    CreatedAt = DateTime.SpecifyKind(new DateTime(2025, 5, 28), DateTimeKind.Utc)
                },
                new Exhibition
                {
                    Id = 14,
                    Title = "Aquifer Chorus",
                    Description = "수중 녹음을 재구성한 사운드 인스톨레이션과 빛의 파동 퍼포먼스.",
                    Artist = "Mira Collective",
                    Host = string.Empty,
                    Participants = string.Empty,
                    Location = "FineArt Hall B1",
                    StartDate = DateTime.SpecifyKind(new DateTime(2025, 12, 1), DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(new DateTime(2026, 5, 10), DateTimeKind.Utc),
                    ImageUrl = "https://images.unsplash.com/photo-1475694867812-f82b8696d610?auto=format&fit=crop&w=2000&q=80",
                    Category = ExhibitionCategory.Digital,
                    CreatedAt = DateTime.SpecifyKind(new DateTime(2025, 6, 8), DateTimeKind.Utc)
                });
        });

    }
}
