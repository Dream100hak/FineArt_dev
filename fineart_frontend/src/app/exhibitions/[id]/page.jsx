import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getExhibitionById } from '@/lib/api';
import {
  findFallbackExhibition,
  formatExhibitionPeriod,
  getExhibitionCategoryLabel,
  normalizeExhibition,
} from '@/lib/exhibitions';

export const revalidate = 0;

const DETAIL_DATE_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'short',
});

const formatDetailDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : DETAIL_DATE_FORMATTER.format(date);
};

async function fetchExhibition(id) {
  if (!id) return { exhibition: null, isFallback: false, fetchError: new Error('Missing id') };

  let payload = null;
  let fetchError = null;

  try {
    payload = await getExhibitionById(id);
  } catch (error) {
    fetchError = error;
    console.error(`[Exhibitions] Failed to fetch detail (${id}):`, error);
  }

  let exhibition = normalizeExhibition(payload);
  let isFallback = false;

  if (!exhibition && fetchError) {
    exhibition = findFallbackExhibition(id);
    isFallback = Boolean(exhibition);
  }

  return { exhibition, isFallback, fetchError };
}

export default async function ExhibitionDetailPage({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  const { exhibition, isFallback } = await fetchExhibition(id);

  if (!exhibition) {
    notFound();
  }

  const detailedPeriod = formatExhibitionPeriod(
    exhibition.startDate,
    exhibition.endDate,
    exhibition.location,
  );

  const schedule = [
    { label: '오프닝', value: formatDetailDate(exhibition.startDate) },
    { label: '클로징', value: formatDetailDate(exhibition.endDate) },
  ].filter((entry) => entry.value);

  return (
    <div className="bg-neutral-950 text-white">
      <div className="relative h-[60vh] overflow-hidden">
        <img
          src={exhibition.imageUrl}
          alt={exhibition.title}
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 pb-12">
          <Link
            href="/exhibitions"
            className="text-xs uppercase tracking-[0.4em] text-white/70 hover:text-white"
          >
            &larr; 전시 목록
          </Link>
          <h1 className="text-5xl font-semibold leading-tight text-white">{exhibition.title}</h1>
          <p className="text-sm uppercase tracking-[0.4em] text-white/70">{detailedPeriod}</p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 lg:flex-row">
        <div className="flex-1 space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">
              {getExhibitionCategoryLabel(exhibition.category)}
            </p>
            <p className="text-lg leading-relaxed text-neutral-50">{exhibition.description}</p>
          </div>

          {isFallback && (
            <p className="rounded-[24px] border border-amber-100/30 bg-amber-100/10 px-4 py-3 text-xs text-amber-100">
              API 호출에 실패해 시드 데이터를 표시합니다.
            </p>
          )}

          {!!schedule.length && (
            <div className="grid gap-4 sm:grid-cols-2">
              {schedule.map((entry) => (
                <article
                  key={entry.label}
                  className="rounded-[30px] border border-white/10 bg-white/5 p-5 backdrop-blur"
                >
                  <p className="text-xs uppercase tracking-[0.4em] text-white/60">{entry.label}</p>
                  <p className="mt-2 text-lg text-white">{entry.value}</p>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="w-full max-w-md space-y-6 rounded-[36px] border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">전시 정보</p>
            <div className="space-y-3 text-sm text-neutral-100">
              {exhibition.host ? <p>Host · {exhibition.host}</p> : null}
              <p>Location · {exhibition.location}</p>
              {exhibition.participants ? (
                <p>Participants · {exhibition.participants}</p>
              ) : null}
              <p>Category · {getExhibitionCategoryLabel(exhibition.category)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">문의</p>
            <p className="text-sm text-neutral-200">
              FineArt 큐레이터에게 작품 상담 또는 프라이빗 투어를 신청해 보세요.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="mailto:curator@fineart.local"
                className="rounded-full bg-white px-4 py-2 text-center text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200"
              >
                curator@fineart.local
              </a>
              <Link
                href="/sales"
                className="rounded-full border border-white/40 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-white/10"
              >
                세일 컬렉션 보기
              </Link>
              <Link
                href="/education"
                className="rounded-full border border-white/40 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-white/10"
              >
                에듀 프로그램
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
