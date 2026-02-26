import Link from 'next/link';
import ArtistCarousel from '@/components/ArtistCarousel';
import BoardSidebar from '@/components/BoardSidebar';
import DomeGallery from '@/components/DomeGallery';
import HeroCarousel from '@/components/exhibitions/HeroCarousel';
import SalesMasonry from '@/components/SalesMasonry';
import { getArtists, getArtworks, getExhibitions } from '@/lib/api';
import {
  buildHeroSlides,
  FALLBACK_EXHIBITIONS,
  formatExhibitionPeriod,
  getExhibitionCategoryLabel,
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

const normalizeArtworkPreview = (item, index) => {
  const rawImage =
    item.imageUrl ?? item.ImageUrl ?? item.image_url ?? item.thumbnailUrl ?? null;
  const hasImage = typeof rawImage === 'string' && rawImage.trim().length > 0;

  return {
    id: item.id ?? item.Id ?? `artwork-${index}`,
    title: item.title ?? item.Title ?? '작품 제목 미정',
    artist: item.artistName ?? item.artist ?? item.Artist ?? (item.artists?.name ?? '작가 정보 없음'),
    price: typeof item.price === 'number' ? item.price : null,
    status: item.status ?? item.Status ?? 'Status',
    imageUrl: hasImage
      ? rawImage
      : DEFAULT_ARTWORK_IMAGE,
    hasRealImage: hasImage,
    createdAt: item.createdAt ?? item.CreatedAt ?? item.created_at ?? null,
  };
};

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
    imageUrl: pickImage(item.imageUrl ?? item.ImageUrl ?? item.image_url, DEFAULT_ARTIST_IMAGE),
  };
};

async function loadHomeData() {
  const [exhibitionResult, artworksResult, artistsResult] = await Promise.allSettled([
    getExhibitions({ page: 1, size: 12 }),
    getArtworks({ page: 1, pageSize: 30 }),
    getArtists(),
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
            const displayArtworkTitle = pick?.title ?? 'Untitled';
            return { ...artist, displayImage, displayArtworkTitle };
          })
      : [];

  return {
    heroSlides: buildHeroSlides(exhibitions),
    exhibitions: exhibitions.slice(0, 4),
    artworks: artworks.slice(0, 25),
    artists: artists.slice(0, 12),
  };
}

export const revalidate = 0;

const DEFAULT_EXHIBITION_IMAGE =
  'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=800&q=80';

export default async function Home() {
  const { heroSlides, exhibitions, artworks, artists } = await loadHomeData();

  return (
    <main className="min-h-screen bg-[var(--board-bg)] text-neutral-900">
      <HeroCarousel slides={heroSlides} />

      <div className="screen-padding-with-sidebar w-full py-4 min-h-[calc(100vh-12rem)] bg-[var(--board-bg)]">
        <div className="flex gap-0 min-h-full items-stretch">
          <BoardSidebar useFixedPosition="dynamic" />
          <div className="flex min-w-0 flex-1 flex-col bg-[var(--board-bg)] pl-52 max-w-[99rem]">
            <div className="mx-auto flex w-full max-w-full flex-col gap-20 px-6 py-16 md:gap-24">
        {/* 현재 전시 */}
        {exhibitions.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-end justify-between gap-4 border-b border-neutral-200 pb-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.35em] text-neutral-500">Exhibition</p>
                <h2 className="mt-1 text-3xl font-semibold text-neutral-900 md:text-4xl">현재 전시</h2>
              </div>
              <Link
                href="/exhibitions"
                className="shrink-0 rounded-full border border-neutral-900 px-5 py-2.5 text-sm font-semibold transition hover:bg-neutral-900 hover:text-white"
              >
                전시 일정 보기
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {exhibitions.map((ex) => {
                const imgSrc = ex.imageUrl || DEFAULT_EXHIBITION_IMAGE;
                const period = formatExhibitionPeriod(ex.startDate, ex.endDate, ex.location);
                return (
                  <Link
                    key={ex.id}
                    href={`/exhibitions/${ex.id}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                      <img
                        src={imgSrc}
                        alt={ex.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition opacity group-hover:opacity-100" />
                      {ex.category && (
                        <span className="absolute right-3 top-3 rounded-full border border-white/50 bg-black/40 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur">
                          {getExhibitionCategoryLabel(ex.category)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <h3 className="line-clamp-2 text-base font-semibold text-neutral-900">{ex.title}</h3>
                      <p className="text-xs text-neutral-500">{period}</p>
                      {ex.description && (
                        <p className="line-clamp-3 text-sm text-neutral-600">{ex.description}</p>
                      )}
                      <span className="mt-auto text-xs font-medium text-neutral-700 underline-offset-4 group-hover:underline">
                        자세히 보기 →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* 인기 작품 */}
        <section className="space-y-8">
          <div className="relative border-b border-neutral-200 pb-4">
            <div className="flex flex-col items-center text-center">
              <p className="text-xs font-medium uppercase tracking-[0.35em] text-neutral-500">Sales</p>
              <h2 className="mt-1 text-3xl font-semibold text-neutral-900 md:text-4xl">지금 인기 있는 작품</h2>
              <p className="mt-2 text-sm text-neutral-500">인기 있는 작품들을 둘러보고 나만의 감성을 찾아보세요</p>
            </div>
            <Link
              href="/sales"
              className="absolute right-0 top-0 rounded-full border border-neutral-900 px-5 py-2.5 text-sm font-semibold transition hover:bg-neutral-900 hover:text-white"
            >
              전체 보기
            </Link>
          </div>
          <SalesMasonry artworks={artworks} />
        </section>

        {/* 오늘의 작품 */}
        <section className="space-y-8">
          <div className="relative border-b border-neutral-200 pb-4">
            <div className="flex flex-col items-center text-center">
              <p className="text-xs font-medium uppercase tracking-[0.35em] text-neutral-500">Works</p>
              <h2 className="mt-1 text-3xl font-semibold text-neutral-900 md:text-4xl">오늘의 작품</h2>
              <p className="mt-2 text-sm text-neutral-500">다양한 작품들을 감상해보세요</p>
            </div>
            <Link
              href="/artists"
              className="absolute right-0 top-0 rounded-full border border-neutral-900 px-5 py-2.5 text-sm font-semibold transition hover:bg-neutral-900 hover:text-white"
            >
              더 보기
            </Link>
          </div>
          <div className="relative h-[720px] w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950">
            <DomeGallery
              images={
                (() => {
                  const list = [
                    ...artists.map((a) => ({
                      src: a.displayImage ?? a.imageUrl,
                      alt: a.name,
                      href: `/artists/${a.slug ?? a.id}`,
                    })),
                    ...artworks.slice(0, 15).map((a) => ({
                      src: a.imageUrl,
                      alt: a.title,
                      href: `/sales/${a.id}`,
                    })),
                  ].filter((i) => i.src);
                  return list.length ? list : undefined;
                })()
              }
              fit={0.8}
              minRadius={1000}
              maxVerticalRotationDeg={0}
              segments={40}
              dragDampening={2}
              grayscale = {false}
            />
          </div>
        </section>

        {/* 작가 정보 */}
        <section className="space-y-8">
          <ArtistCarousel
            items={artists}
            categoryLabel="Artist"
            title="FineArt 작가"
            subtitle="다양한 작가들을 만나보세요"
            moreHref="/artists"
            moreLabel="전체 작가 보기"
          />
        </section>

        {/* CTA */}
        <section
          className="rounded-3xl border px-8 py-12 text-center md:px-12 md:py-16"
          style={{ borderColor: 'var(--board-border)', backgroundColor: 'var(--board-bg-secondary)' }}
        >
          <p className="text-xs font-medium uppercase tracking-[0.4em]" style={{ color: 'var(--board-text-secondary)' }}>
            Visit & Contact
          </p>
          <h2 className="mt-3 text-2xl font-semibold md:text-3xl" style={{ color: 'var(--board-text)' }}>
            전시와 작품을 직접 만나보세요
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/exhibitions"
              className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              전시 일정 보기
            </Link>
            <Link
              href="/sales"
              className="rounded-full border-2 border-neutral-900 px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
            >
              작품 보기
            </Link>
            <Link
              href="/boards"
              className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
            >
              소식 보기
            </Link>
          </div>
        </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
