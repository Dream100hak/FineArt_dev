'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FiSearch } from 'react-icons/fi';
import { FiBox, FiGrid, FiHome, FiStar } from 'react-icons/fi';

const TYPE_ICON_MAP = {
  museum: FiHome,
  heritage: FiBox,
  gallery: FiGrid,
  art_space: FiStar,
  other: FiBox,
};

const buildNextUrl = (pathname, searchParams, updates) => {
  const params = new URLSearchParams(searchParams?.toString() ?? '');
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
};

export default function MuseumsClient({
  major,
  district,
  type,
  keyword,
  page,
  pageSize,
  total,
  items,
  majorOptions,
  districtOptions,
  typeOptions,
  typeCounts,
  dataSource,
  totalSourceCount,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [keywordInput, setKeywordInput] = useState(() => keyword ?? '');
  const [isPending, startTransition] = useTransition();

  const push = (updates) => {
    startTransition(() => router.push(buildNextUrl(pathname, searchParams, updates)));
  };

  const [selectedId, setSelectedId] = useState(null);

  const selected = useMemo(() => {
    if (items.length === 0) return null;
    if (selectedId == null) return items[0] ?? null;
    const found = items.find((r) => r.id === selectedId);
    return found ?? items[0] ?? null;
  }, [items, selectedId]);

  const mapUrl = selected
    ? `https://www.google.com/maps?q=${encodeURIComponent(selected.address || selected.name)}&output=embed`
    : '';

  const handleType = (value) => {
    push({ type: value || undefined, page: 1 });
  };

  const handleMajor = (value) => {
    push({ major: value || undefined, district: undefined, page: 1 });
  };

  const handleDistrict = (value) => {
    push({ district: value || undefined, page: 1 });
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const trimmed = keywordInput.trim();
    push({ keyword: trimmed || undefined, page: 1 });
  };

  const handleMovePage = (next) => {
    if (next < 1) return;
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    if (next > maxPage) return;
    push({ page: next });
  };

  const handleReset = () => {
    setKeywordInput('');
    push({
      major: undefined,
      district: undefined,
      type: undefined,
      keyword: undefined,
      page: 1,
    });
  };

  const currentPage = Math.max(1, Number(page) || 1);
  const totalPage = Math.max(1, Math.ceil((Number(total) || 0) / (Number(pageSize) || 1)));
  const isSeoulMajor = major === '서울특별시';

  return (
    <div className="flex flex-col gap-6">
      <div className="rb-glass-panel flex flex-col gap-4 rounded-[28px] p-4 shadow-sm md:p-6">
        <div className="relative z-10 flex flex-col gap-3 rounded-2xl border border-neutral-200/70 bg-white/85 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-neutral-600">
            총 <span className="font-semibold text-neutral-900">{total}</span>곳
            <span className="ml-2 text-xs text-neutral-400">
              (원본 {totalSourceCount} · {dataSource === 'supabase' ? 'DB' : 'JSON'})
            </span>
          </div>
          <form onSubmit={handleSearch} className="flex w-full gap-2 sm:w-auto sm:min-w-[440px]">
            <div className="relative flex-1">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                placeholder="미술관명, 주소, 전화번호 검색"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                className="w-full rounded-full border border-neutral-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-neutral-900 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-neutral-800 disabled:opacity-60"
            >
              검색
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-700 transition hover:-translate-y-[1px] hover:border-neutral-900 hover:text-neutral-900"
            >
              초기화
            </button>
          </form>
        </div>

        <div className="relative z-10 grid gap-3">
          <div className="rb-filter-card rounded-2xl border-teal-200/80 bg-teal-50/90 p-3">
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleMajor('')}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                !major
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-teal-200 bg-white text-teal-900 hover:border-neutral-300'
              }`}
            >
              전체 지역
            </button>
            {majorOptions.map((r) => {
              const active = major === r.value;
              return (
                <button
                  key={`major-${r.value}`}
                  type="button"
                  onClick={() => handleMajor(r.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    active
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-teal-200 bg-white text-teal-900 hover:-translate-y-[1px] hover:border-neutral-300'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
          </div>

          {isSeoulMajor && districtOptions.length > 0 ? (
            <div className="rb-filter-card rounded-2xl border border-neutral-200 bg-white p-3">
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleDistrict('')}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  !district
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                }`}
              >
                전체 구
              </button>
              {districtOptions.map((d) => {
                const active = district === d.value;
                return (
                  <button
                    key={`district-${d.value}`}
                    type="button"
                    onClick={() => handleDistrict(d.value)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      active
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:-translate-y-[1px] hover:border-neutral-400'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            </div>
          ) : null}
        </div>

        <div className="relative z-10 grid gap-3 lg:grid-cols-1 lg:items-start">
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white/85 p-2 shadow-sm">
            <div className="grid grid-cols-1 gap-2 px-2 pb-2 sm:grid-cols-2 lg:grid-cols-5">
              {typeOptions.map((cat) => {
                const active = (type || '') === (cat.value || '');
                const count = cat.value ? Number(typeCounts?.[cat.value] ?? 0) : total;
                const Icon = TYPE_ICON_MAP[cat.value || 'other'] ?? FiBox;

                return (
                  <button
                    key={cat.value || 'all-type'}
                    type="button"
                    onClick={() => handleType(cat.value)}
                    aria-pressed={active}
                    className={`group relative overflow-hidden rounded-2xl border px-3 py-3 text-left transition ${
                      active
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-lg'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-neutral-700'}`} aria-hidden />
                        <span className="truncate text-sm font-semibold">{cat.label}</span>
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          active ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {count}
                      </span>
                    </div>
                    <span className={`mt-1 block text-[11px] ${active ? 'text-white/80' : 'text-neutral-500'}`}>
                      {active ? '현재 적용 중' : '클릭해 필터'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-stretch">
        <div className="min-w-0 flex max-h-[min(70vh,680px)] flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <ul className="divide-y divide-neutral-100 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-neutral-500">
                조건에 맞는 시설이 없습니다. 필터를 바꿔 보세요.
              </li>
            ) : (
              items.map((row) => {
                const isSel = Boolean(selected && row.id === selected.id);
                return (
                  <li key={row.id}>
                    <div
                      className={`rb-list-item flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-neutral-50 ${
                        isSel ? 'bg-neutral-900/[0.03]' : ''
                      }`}
                      onClick={() => setSelectedId(row.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setSelectedId(row.id);
                      }}
                    >
                      <span
                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-sm ${row.typeIconClass}`}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-neutral-900">{row.name}</p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {row.typeLabel} · {row.major} {row.district}
                        </p>
                        <p className="mt-1 text-sm text-neutral-600">{row.address || '주소 정보 없음'}</p>
                        {row.phone && <p className="mt-0.5 text-xs text-neutral-500">{row.phone}</p>}
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Link
                          href={`/museums/${encodeURIComponent(row.id)}`}
                          className="shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
                        >
                          상세
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <div className="min-w-0 flex min-h-[320px] flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100 shadow-sm lg:min-h-[min(70vh,680px)]">
          {selected ? (
            <>
              <div className="relative min-h-[280px] w-full flex-1 bg-neutral-200">
                <iframe
                  title={`${selected.name} 주변 지도`}
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={mapUrl}
                />
                <p className="pointer-events-none absolute bottom-2 left-2 right-2 rounded-lg bg-black/55 px-2 py-1 text-center text-[11px] text-white/95">
                  주소 검색 기반 지도입니다. 정확한 위치는 기관 공식 안내를 확인해 주세요.
                </p>
              </div>
              <div className="space-y-1 border-t border-neutral-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-neutral-900">{selected.name}</h3>
                <p className="text-xs text-neutral-600">{selected.address || '주소 정보 없음'}</p>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-sm text-neutral-500">
              목록에서 시설을 선택하면 지도가 표시됩니다.
            </div>
          )}
        </div>
      </div>

      <section className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">페이지 이동</h2>
            <p className="mt-1 text-sm text-neutral-500">
              {currentPage} / {totalPage} 페이지
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleMovePage(currentPage - 1)}
              disabled={currentPage <= 1 || isPending}
              className="rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-700 hover:border-neutral-900 disabled:opacity-40"
            >
              이전
            </button>
            <button
              type="button"
              onClick={() => handleMovePage(currentPage + 1)}
              disabled={currentPage >= totalPage || isPending}
              className="rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-700 hover:border-neutral-900 disabled:opacity-40"
            >
              다음
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 6).map((row) => (
            <article key={row.id} className="rounded-2xl border border-neutral-100 bg-neutral-50/80 p-4">
              <h3 className="font-semibold text-neutral-900">{row.name}</h3>
              <p className="mt-1 text-xs text-neutral-500">
                {row.typeLabel} · {row.major} {row.district}
              </p>
              <p className="mt-2 text-sm text-neutral-600">{row.address || '주소 미상'}</p>
              <Link
                href={`/museums/${encodeURIComponent(row.id)}`}
                className="mt-3 inline-flex rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
              >
                상세 페이지
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
