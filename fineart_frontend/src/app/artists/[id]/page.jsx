import { notFound } from 'next/navigation';
import Link from 'next/link';
import { FiHeart, FiShare2 } from 'react-icons/fi';
import { findArtistProfile } from '@/lib/artistCatalog';

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('ko-KR');
  } catch (error) {
    return value;
  }
};

export const revalidate = 0;

export default async function ArtistDetailPage({ params }) {
  const resolvedParams = await params;
  const rawId = resolvedParams?.id ?? '';
  const decodedId = (() => {
    try {
      return decodeURIComponent(rawId);
    } catch {
      return rawId;
    }
  })();

  const profile = await findArtistProfile(decodedId);
  if (!profile) {
    notFound();
  }

  const { name, nationality, discipline, bio, artworks, exhibitions, isFallback } = profile;

  const infoBadges = [
    nationality ? `${nationality}` : null,
    discipline ?? '',
    `${artworks.length} 작품`,
    `${exhibitions.length} 전시`,
  ].filter(Boolean);

  return (
    <div className="screen-padding section mx-auto flex w-full max-w-7xl flex-col gap-10">
      <Link href="/artists" className="text-sm text-primary hover:underline">
        ← 작가 목록
      </Link>

      <article className="space-y-6 rounded-3xl border border-neutral-100 bg-white px-8 py-10 text-center shadow-sm">
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold text-neutral-900">{name}</h1>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-600">
            {infoBadges.map((badge) => (
              <span key={badge} className="rounded-full bg-neutral-100 px-3 py-1">
                {badge}
              </span>
            ))}
          </div>
          {isFallback && (
            <p className="rounded-2xl bg-amber-50 px-4 py-2 text-xs text-amber-800">
              서버 연결이 없어 임시 데이터로 표시 중입니다.
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 text-sm text-neutral-600">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 transition hover:border-neutral-900 hover:text-neutral-900"
          >
            <FiShare2 /> 공유
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 transition hover:border-neutral-900 hover:text-neutral-900"
          >
            <FiHeart /> 찜하기
          </button>
        </div>
      </article>

      <div className="sticky top-16 z-10 flex items-center gap-3 rounded-full border border-neutral-200 bg-white/90 px-4 py-2 text-sm text-neutral-600 backdrop-blur">
        <a href="#works" className="rounded-full px-3 py-1 font-semibold text-neutral-900 hover:bg-neutral-900/10">
          작품
        </a>
        <a href="#history" className="rounded-full px-3 py-1 font-semibold text-neutral-900 hover:bg-neutral-900/10">
          이력
        </a>
        <a href="#exhibitions" className="rounded-full px-3 py-1 font-semibold text-neutral-900 hover:bg-neutral-900/10">
          전시
        </a>
      </div>

      <section id="works" className="space-y-4 rounded-3xl border border-neutral-100 bg-white px-6 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">작품</h2>
          <span className="text-sm text-neutral-500">{artworks.length}점</span>
        </div>
        {artworks.length === 0 ? (
          <p className="text-sm text-neutral-500">등록된 작품이 없습니다.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {artworks.slice(0, 12).map((artwork) => {
              const detailHref =
                artwork.slug || artwork.id
                  ? `/sales/${encodeURIComponent(artwork.slug ?? artwork.id)}`
                  : null;
              return (
                <Link
                  key={artwork.id}
                  href={detailHref ?? '/sales'}
                  className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-neutral-200 to-neutral-100">
                    {artwork.imageUrl ? (
                      <img
                        src={artwork.imageUrl}
                        alt={artwork.title}
                        className="h-full w-full object-cover transition duration-700 hover:scale-[1.03]"
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                  <div className="space-y-1 px-4 py-3">
                    <p className="text-sm font-semibold text-neutral-900 line-clamp-2">{artwork.title}</p>
                    <p className="text-xs text-neutral-500">
                      {formatDate(artwork.createdAt)} · {artwork.status ?? 'Status'}
                    </p>
                    {artwork.price ? (
                      <p className="text-sm font-semibold text-neutral-800">
                        {artwork.price.toLocaleString('ko-KR')} KRW
                      </p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section
        id="history"
        className="space-y-3 rounded-3xl border border-neutral-100 bg-white px-6 py-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">이력</h2>
        </div>
        {bio ? <p className="text-sm leading-relaxed text-neutral-600">{bio}</p> : <p className="text-sm text-neutral-500">등록된 이력이 없습니다.</p>}
      </section>

      <section
        id="exhibitions"
        className="space-y-4 rounded-3xl border border-neutral-100 bg-white px-6 py-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">전시</h2>
          <span className="text-sm text-neutral-500">{exhibitions.length}건</span>
        </div>
        {exhibitions.length === 0 ? (
          <p className="text-sm text-neutral-500">예정/과거 전시가 없습니다.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {exhibitions.slice(0, 10).map((exhibition) => {
              const detailHref =
                exhibition.slug || exhibition.id
                  ? `/exhibitions/${encodeURIComponent(exhibition.slug ?? exhibition.id)}`
                  : null;
              return (
                <Link
                  key={exhibition.id}
                  href={detailHref ?? '/exhibitions'}
                  className="flex flex-col gap-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <p className="text-sm font-semibold text-neutral-900">{exhibition.title}</p>
                  <p className="text-xs text-neutral-500">
                    {formatDate(exhibition.startDate)} ~ {formatDate(exhibition.endDate)}
                  </p>
                  {exhibition.location ? (
                    <p className="text-xs text-neutral-500">장소 · {exhibition.location}</p>
                  ) : null}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
