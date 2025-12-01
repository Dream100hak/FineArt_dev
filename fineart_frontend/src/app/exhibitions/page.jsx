import Link from 'next/link';
import ExhibitionFilters from '@/components/exhibitions/ExhibitionFilters';
import ExhibitionPagination from '@/components/exhibitions/ExhibitionPagination';
import { getExhibitions } from '@/lib/api';
import {
  EXHIBITION_CATEGORIES,
  EXHIBITION_CATEGORY_VALUE_SET,
  FALLBACK_EXHIBITIONS,
  filterExhibitionsByQuery,
  formatExhibitionPeriod,
  getExhibitionCategoryLabel,
  normalizeExhibitionsFromPayload,
} from '@/lib/exhibitions';

export const revalidate = 0;

const parsePositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const formatDateLabel = (value) => {
  if (!value) return '미정';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '미정' : date.toLocaleDateString('ko-KR');
};

export default async function ExhibitionsPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const rawCategory = (resolvedParams?.category ?? '').toString().toLowerCase();
  const category = EXHIBITION_CATEGORY_VALUE_SET.has(rawCategory) ? rawCategory : '';
  const keyword = (resolvedParams?.keyword ?? '').toString();
  const page = parsePositiveNumber(resolvedParams?.page, 1);
  const size = parsePositiveNumber(resolvedParams?.size, 9);

  let payload = null;
  let fetchError = null;

  try {
    payload = await getExhibitions({
      category: category || undefined,
      keyword: keyword || undefined,
      search: keyword || undefined,
      page,
      size,
    });
  } catch (error) {
    console.error('[Exhibitions] Failed to fetch exhibitions:', error);
    fetchError = error;
  }

  const normalizedApi = normalizeExhibitionsFromPayload(payload);
  const isFallback = Boolean(fetchError);

  let visibleExhibitions = normalizedApi;
  let total = payload?.total ?? normalizedApi.length;
  let currentPage = payload?.page ?? page;
  let currentSize = payload?.size ?? size;

  if (isFallback) {
    const filteredFallback = filterExhibitionsByQuery(FALLBACK_EXHIBITIONS, {
      category,
      keyword,
    });
    total = filteredFallback.length;
    currentPage = page;
    currentSize = size;
    const start = (page - 1) * size;
    visibleExhibitions = filteredFallback.slice(start, start + size);
  }

  const hasResults = visibleExhibitions.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-16">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">FineArt Exhibition</p>
        <h1 className="text-5xl font-semibold text-neutral-900">전시 일정</h1>
        {fetchError && (
          <p className="rounded-2xl bg-amber-50 px-4 py-2 text-xs text-amber-700">
            API 응답에 문제가 발생했습니다. 새로고침 후 다시 시도해주세요.
          </p>
        )}
      </header>

      <ExhibitionFilters categories={EXHIBITION_CATEGORIES} activeCategory={category} initialKeyword={keyword} />

      <section>
        <header className="mb-10 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Category</p>
            <h2 className="text-3xl font-semibold text-neutral-900">
              {category ? getExhibitionCategoryLabel(category) : '전체'}
            </h2>
          </div>
          <p className="text-sm text-neutral-500">총 {total}건 · 페이지 {currentPage}</p>
        </header>

        {hasResults ? (
          <>
            <div className="grid gap-8 md:grid-cols-2 lg:gap-10">
              {visibleExhibitions.map((exhibition) => {
                const badgeLabel = exhibition.category
                  ? getExhibitionCategoryLabel(exhibition.category)
                  : '기타';
                const period = formatExhibitionPeriod(
                  exhibition.startDate,
                  exhibition.endDate,
                  exhibition.location,
                );

                return (
                  <article key={exhibition.id} className="space-y-4">
                    <div className="group relative h-[360px] w-full overflow-hidden rounded-[48px] border border-neutral-200 shadow-lg shadow-black/10 md:h-[440px]">
                      <img
                        src={exhibition.imageUrl}
                        alt={exhibition.title}
                        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-7 pb-7 text-white">
                        <div className="space-y-2">
                          <p className="text-[11px] uppercase tracking-[0.4em] text-white/70">{period}</p>
                          <h3 className="text-3xl font-semibold leading-tight md:text-[34px]">
                            {exhibition.title}
                          </h3>
                        </div>
                        <span className="whitespace-nowrap rounded-full border border-white/40 px-4 py-1 text-xs uppercase tracking-[0.3em]">
                          {badgeLabel}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between gap-3 text-sm text-neutral-600 md:flex-row md:items-center">
                      <div>
                        <p className="font-medium text-neutral-900">{exhibition.host || exhibition.artist}</p>
                        <p>{exhibition.location}</p>
                      </div>
                      <div className="text-neutral-500">
                        <p>시작 · {formatDateLabel(exhibition.startDate)}</p>
                        <p>종료 · {formatDateLabel(exhibition.endDate)}</p>
                      </div>
                    </div>
                    <Link
                      href={`/exhibitions/${exhibition.id}`}
                      className="inline-flex text-sm font-semibold text-neutral-900 underline-offset-8 hover:underline"
                    >
                      상세 보기
                    </Link>
                  </article>
                );
              })}
            </div>
            <div className="pt-8">
              <ExhibitionPagination page={currentPage} size={currentSize} total={total} />
            </div>
          </>
        ) : (
          <div className="relative overflow-hidden rounded-[32px] border border-neutral-200 bg-gradient-to-br from-neutral-900 via-[#0f172a] to-[#1f2937] text-white shadow-2xl">
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  'url(https://images.unsplash.com/photo-1520697830682-bbb6e85e2b1b?auto=format&fit=crop&w=1800&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className="relative grid gap-6 px-8 py-12 md:grid-cols-[1.3fr_1fr] md:items-center md:px-12 md:py-14">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.35em] text-white/80">FineArt Curated</p>
                <h3 className="text-3xl font-semibold leading-snug md:text-4xl">준비 중인 전시를 곧 만나보세요.</h3>
                <p className="text-sm text-white/80 md:text-base">
                  새로운 전시를 큐레이션하는 중입니다. 작품 판매·렌탈 컬렉션을 먼저 둘러보거나,
                  뉴스레터를 통해 업데이트를 받아보세요.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    href="/sales"
                    className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-neutral-900 shadow transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    판매·렌탈 컬렉션 보기
                  </Link>
                  <Link
                    href="/"
                    className="rounded-full border border-white/50 px-5 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                  >
                    홈으로 이동
                  </Link>
                </div>
              </div>
              <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur md:space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/70">FineArt Insight</p>
                <h4 className="text-xl font-semibold md:text-2xl">새 전시 알림 신청</h4>
                <p className="text-sm text-white/70">
                  곧 공개될 전시 소식을 가장 먼저 받아보세요. 큐레이터 추천 작품과 프라이빗 투어 안내를 보내드립니다.
                </p>
                <div className="flex flex-col gap-2">
                  <input
                    type="email"
                    placeholder="이메일을 입력하세요"
                    className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-white focus:outline-none"
                  />
                  <button className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow transition hover:-translate-y-0.5 hover:shadow-lg">
                    알림 받기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
