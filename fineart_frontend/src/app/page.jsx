import Link from 'next/link';
import HeroCarousel from '@/components/exhibitions/HeroCarousel';
import { getArtists, getArtworks, getBoards, getExhibitions } from '@/lib/api';
import {
  buildHeroSlides,
  FALLBACK_EXHIBITIONS,
  normalizeExhibitionsFromPayload,
} from '@/lib/exhibitions';

const DEFAULT_ARTWORK_IMAGE =
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1600&q=80';

const DEFAULT_ARTIST_IMAGE =
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80';

const pickImage = (value, fallback) => {
  const candidate = typeof value === 'string' ? value.trim() : '';
  return candidate ? candidate : fallback;
};

const toKey = (value) => value?.toString().trim().toLowerCase() || '';

const formatPrice = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
};

const normalizeArtworkPreview = (item, index) => ({
  id: item.id ?? item.Id ?? `artwork-${index}`,
  title: item.title ?? item.Title ?? '작품 제목 미정',
  artist: item.artistName ?? item.artist ?? item.Artist ?? '작가 정보 없음',
  price: typeof item.price === 'number' ? item.price : null,
  status: item.status ?? item.Status ?? 'Status',
  imageUrl: pickImage(
    item.imageUrl ?? item.ImageUrl ?? item.thumbnailUrl,
    DEFAULT_ARTWORK_IMAGE,
  ),
  createdAt: item.createdAt ?? item.CreatedAt ?? null,
});

const normalizeArtistPreview = (item, index) => {
  const name = item.name ?? item.Name ?? '작가 이름 미정';
  const slugCandidate = item.slug ?? item.Slug ?? name;
  return {
    id: item.id ?? item.Id ?? `artist-${index}`,
    slug: slugCandidate || `artist-${index}`,
    name,
    headline:
      item.discipline ??
      item.category ??
      item.bio ??
      '작가 소개가 준비 중입니다.',
    imageUrl: pickImage(item.imageUrl ?? item.ImageUrl, DEFAULT_ARTIST_IMAGE),
  };
};

const normalizeBoardPreview = (item, index) => ({
  id: item.id ?? item.Id ?? `board-${index}`,
  name: item.name ?? item.Name ?? '게시판',
  slug: item.slug ?? item.Slug ?? 'board',
  description: item.description ?? item.Description ?? '게시판 소개가 준비 중입니다.',
  articleCount: item.articleCount ?? item.articlesCount ?? item.count ?? 0,
});

async function loadHomeData() {
  const [exhibitionResult, artworksResult, artistsResult, boardsResult] = await Promise.allSettled([
    getExhibitions({ page: 1, size: 6 }),
    getArtworks({ page: 1, pageSize: 6 }),
    getArtists(),
    getBoards({ page: 1, size: 5, sort: 'order' }),
  ]);

  const exhibitions =
    exhibitionResult.status === 'fulfilled'
      ? normalizeExhibitionsFromPayload(exhibitionResult.value)
      : FALLBACK_EXHIBITIONS;

  const artworks =
    artworksResult.status === 'fulfilled'
      ? (Array.isArray(artworksResult.value?.items)
          ? artworksResult.value.items
          : Array.isArray(artworksResult.value)
            ? artworksResult.value
            : []
        ).map(normalizeArtworkPreview)
      : [];

  const artworksByKey = artworks.reduce((map, artwork) => {
    const key = toKey(artwork.artist);
    if (!key) return map;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(artwork);
    return map;
  }, new Map());

  const artists =
    artistsResult.status === 'fulfilled'
      ? (Array.isArray(artistsResult.value?.items)
          ? artistsResult.value.items
          : Array.isArray(artistsResult.value)
            ? artistsResult.value
            : []
        )
          .map(normalizeArtistPreview)
          .map((artist) => {
            const key = toKey(artist.name);
            const related = artworksByKey.get(key) ?? [];
            const sorted = [...related].sort((a, b) => {
              const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return db - da;
            });
            const pick =
              sorted.find((item) => item.createdAt) ??
              (sorted.length ? sorted[Math.floor(Math.random() * sorted.length)] : null);
            const displayImage = pickImage(
              pick?.imageUrl ?? artist.imageUrl,
              DEFAULT_ARTIST_IMAGE,
            );
            return { ...artist, displayImage };
          })
      : [];

  const boards =
    boardsResult.status === 'fulfilled'
      ? (Array.isArray(boardsResult.value?.items)
          ? boardsResult.value.items
          : Array.isArray(boardsResult.value)
            ? boardsResult.value
            : []
        ).map(normalizeBoardPreview)
      : [];

  return {
    heroSlides: buildHeroSlides(exhibitions),
    artworks: artworks.slice(0, 3),
    artists: artists.slice(0, 3),
    boards: boards.slice(0, 5),
  };
}

export const revalidate = 0;

export default async function Home() {
  const { heroSlides, artworks, artists, boards } = await loadHomeData();

  return (
    <main className="bg-[#f8f4e8] text-neutral-900">
      <HeroCarousel slides={heroSlides} />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-16">
        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">판매</p>
              <h2 className="text-3xl font-semibold">지금 인기 있는 작품</h2>
            </div>
            <Link
              href="/sales"
              className="rounded-full border border-neutral-900 px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-neutral-900 hover:text-white"
            >
              전체 보기
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {artworks.map((artwork) => (
              <Link
                key={artwork.id}
                href={`/sales/${artwork.id}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute right-3 top-3 rounded-full border border-white/40 bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    {artwork.status}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">FineArt Sales</p>
                  <h3 className="text-lg font-semibold text-neutral-900">{artwork.title}</h3>
                  <p className="text-sm text-neutral-600">{artwork.artist}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-base font-semibold text-neutral-900">
                      {formatPrice(artwork.price)}
                    </span>
                    <span className="text-xs text-neutral-500">자세히 보기 →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">작가</p>
              <h2 className="text-3xl font-semibold">FineArt 아티스트</h2>
            </div>
            <Link
              href="/artists"
              className="rounded-full border border-neutral-900 px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-neutral-900 hover:text-white"
            >
              더 보기
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artists/${artist.slug ?? artist.id}`}
                className="group overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={artist.displayImage ?? artist.imageUrl}
                    alt={artist.name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-2 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Artist</p>
                  <h3 className="text-lg font-semibold text-neutral-900">{artist.name}</h3>
                  <p className="text-sm text-neutral-600">{artist.headline}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">게시판</p>
              <h2 className="text-3xl font-semibold">오늘의 포스트</h2>
            </div>
            <Link
              href="/boards"
              className="rounded-full border border-neutral-900 px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-neutral-900 hover:text-white"
            >
              전체 게시판
            </Link>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm">
            <div className="grid grid-cols-12 bg-neutral-50 px-4 py-3 text-xs uppercase tracking-[0.25em] text-neutral-500">
              <span className="col-span-4">게시판</span>
              <span className="col-span-6">소개</span>
              <span className="col-span-2 text-right">글 수</span>
            </div>
            <div className="divide-y divide-neutral-100">
              {boards.map((board) => (
                <Link
                  key={board.id}
                  href={`/boards/${board.slug}`}
                  className="grid grid-cols-12 items-center px-4 py-4 transition hover:bg-neutral-50"
                >
                  <span className="col-span-4 text-sm font-semibold text-neutral-900">{board.name}</span>
                  <span className="col-span-6 text-sm text-neutral-600">{board.description}</span>
                  <span className="col-span-2 text-right text-sm text-neutral-500">
                    {board.articleCount?.toLocaleString?.() ?? 0}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
