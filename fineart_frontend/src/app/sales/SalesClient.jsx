'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { FiArrowRight, FiRefreshCcw, FiSearch } from 'react-icons/fi';
import { getArtworks } from '@/lib/api';

const THEMES = ['\uc804\uccb4', '\uc778\ubb3c', '\ud48d\uacbd', '\uc815\ubb3c', '\ub3d9\ubb3c', '\uc0c1\uc0c1', '\ucd94\uc0c1'];
const SIZE_OPTIONS = ['1\ud638~5\ud638', '6\ud638~10\ud638', '11\ud638~20\ud638', '30\ud638~50\ud638', '50\ud638~80\ud638', '80\ud638 \uc774\uc0c1'];
const MATERIAL_OPTIONS = ['\uc720\ud654', '\uc218\ucc44\ud654', '\uc544\ud06c\ub9b4', '\ud63c\ud569\uc7ac\ub8cc', '\ub4dc\ub85c\uc789', '\ud310\ud654', '\uc0ac\uc9c4'];
const PRICE_BUCKETS = [
  { label: '~30\ub9cc\uc6d0', min: 0, max: 300_000 },
  { label: '30~50\ub9cc\uc6d0', min: 300_000, max: 500_000 },
  { label: '50~100\ub9cc\uc6d0', min: 500_000, max: 1_000_000 },
  { label: '100\ub9cc\uc6d0~', min: 1_000_000, max: undefined },
];
const PAGE_SIZE = 9;

const STATUS_BADGES = {
  ForSale: { label: '\ud310\ub9e4\uc911', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Sold: { label: '\ud310\ub9e4\uc644\ub8cc', className: 'bg-neutral-100 text-neutral-500 border-neutral-200' },
  Rentable: { label: '\ub80c\ud0c8\uac00\ub2a5', className: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const formatPrice = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
};

const ArtworkStatusBadge = ({ status }) => {
  const badge = STATUS_BADGES[status] ?? {
    label: status,
    className: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
  );
};

const FilterPill = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-4 py-2 text-sm transition hover:border-neutral-900 hover:text-neutral-900 ${
      active ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 text-neutral-500'
    }`}
  >
    {label}
  </button>
);

const FilterCheckbox = ({ label, checked, onChange }) => (
  <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-600">
    <input
      type="checkbox"
      className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
    {label}
  </label>
);

export default function SalesClient() {
  const [artworks, setArtworks] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState({
    keyword: '',
    theme: '',
    size: '',
    materials: [],
    price: null,
    rentableOnly: false,
  });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);
  const paginationLabel = `${total.toLocaleString()}점 · ${page}/${totalPages} 페이지`;

  const beginFetch = () => {
    setIsLoading(true);
    setError(null);
  };

  useEffect(() => {
    let isActive = true;

    const query = {
      page,
      pageSize: PAGE_SIZE,
      keyword: filters.keyword || undefined,
      theme: filters.theme || undefined,
      size: filters.size || undefined,
      material: filters.materials.length ? filters.materials.join(',') : undefined,
      priceMin: filters.price?.min,
      priceMax: filters.price?.max,
      rentable: filters.rentableOnly ? true : undefined,
    };

    getArtworks(query)
      .then((payload) => {
        if (!isActive) return;
        setArtworks(payload?.items ?? []);
        setTotal(payload?.total ?? 0);
        setPage(payload?.page ?? page);
      })
      .catch((err) => {
        if (!isActive) return;
        console.error('[Sales] Failed to fetch artworks:', err);
        setError(err);
        setArtworks([]);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [filters, page]);

  const handleFilterChange = (updater) => {
    beginFetch();
    setPage(1);
    setFilters((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return { ...prev, ...next };
    });
  };

  const goToPage = (nextPage) => {
    beginFetch();
    setPage(nextPage);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    handleFilterChange({ keyword: searchValue.trim() });
  };

  const toggleMaterial = (material) => {
    handleFilterChange((prev) => {
      const selected = new Set(prev.materials);
      if (selected.has(material)) {
        selected.delete(material);
      } else {
        selected.add(material);
      }
      return { materials: Array.from(selected) };
    });
  };

  const toggleRentable = () => {
    handleFilterChange({ rentableOnly: !filters.rentableOnly });
  };

  const handleResetFilters = () => {
    beginFetch();
    setSearchValue('');
    setPage(1);
    setFilters({
      keyword: '',
      theme: '',
      size: '',
      materials: [],
      price: null,
      rentableOnly: false,
    });
  };

  const handlePriceClick = (bucket) => {
    const isActive = filters.price?.label === bucket.label;
    handleFilterChange({ price: isActive ? null : bucket });
  };

  const handleThemeClick = (theme) => {
    handleFilterChange({ theme: theme === '전체' ? '' : theme });
  };

  const handleSizeClick = (size) => {
    handleFilterChange({ size: filters.size === size ? '' : size });
  };

  const paginationControls = (
    <div className="flex items-center justify-between border-t border-neutral-200 pt-8">
      <div className="text-sm text-neutral-500">{paginationLabel}</div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => goToPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm text-neutral-700 disabled:opacity-40"
        >
          이전
        </button>
        <button
          type="button"
          onClick={() => goToPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm text-neutral-700 disabled:opacity-40"
        >
          다음
        </button>
      </div>
    </div>
  );

  return (
    <main className="bg-white text-neutral-900">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-16">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-400">FineArt Sales & Rental</p>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-semibold leading-tight md:text-5xl">판매 · 렌탈 컬렉션</h1>
              <p className="mt-3 max-w-2xl text-sm text-neutral-500">
                원하는 작품을 빠르게 찾아보세요. 테마, 사이즈, 재질, 가격 그리고 렌탈 가능 여부까지 한 번에 비교할 수 있습니다.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 self-start rounded-full border border-neutral-300 px-4 py-2 text-sm text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900"
            >
              <FiRefreshCcw /> 초기화
            </button>
          </div>
        </header>

        <section className="space-y-6 rounded-[32px] border border-neutral-200 bg-neutral-50/70 p-6 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {THEMES.map((theme) => (
              <FilterPill key={theme} label={theme} active={(filters.theme || '전체') === theme} onClick={() => handleThemeClick(theme)} />
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">사이즈</p>
              <div className="flex flex-wrap gap-2">
                {SIZE_OPTIONS.map((size) => (
                  <FilterPill key={size} label={size} active={filters.size === size} onClick={() => handleSizeClick(size)} />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.35em] text-neutral-500">재질</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {MATERIAL_OPTIONS.map((material) => (
                  <FilterCheckbox key={material} label={material} checked={filters.materials.includes(material)} onChange={() => toggleMaterial(material)} />
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {PRICE_BUCKETS.map((bucket) => (
                <FilterPill
                  key={bucket.label}
                  label={`${bucket.label}`}
                  active={filters.price?.label === bucket.label}
                  onClick={() => handlePriceClick(bucket)}
                />
              ))}
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <button
                type="button"
                onClick={toggleRentable}
                className={`flex items-center justify-between rounded-full border px-5 py-2 text-sm transition ${
                  filters.rentableOnly
                    ? 'border-amber-500 bg-amber-500/10 text-amber-700'
                    : 'border-neutral-300 text-neutral-500 hover:border-neutral-900 hover:text-neutral-900'
                }`}
              >
                렌탈 가능만 보기
              </button>
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2">
                <FiSearch className="text-neutral-400" />
                <input
                  type="search"
                  placeholder="작품, 작가 검색"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  className="w-48 bg-transparent text-sm outline-none"
                />
                <button type="submit" className="text-sm font-semibold text-neutral-900">
                  검색
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-400">Result</p>
              <h2 className="text-2xl font-semibold text-neutral-900">총 {total.toLocaleString()}점</h2>
            </div>
            {error && (
              <p className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-700">
                작품 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <div key={`skeleton-${index}`} className="h-[420px] animate-pulse rounded-[32px] border border-neutral-100 bg-neutral-50 p-6" />
              ))}
            </div>
          ) : artworks.length > 0 ? (
            <div className="columns-1 md:columns-2 lg:columns-3 [column-gap:1.5rem]">
              {artworks.map((artwork) => (
                <Link
                  key={artwork.id}
                  href={`/sales/${artwork.id}`}
                  className="group mb-6 block break-inside-avoid rounded-[34px] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30"
                >
                  <article className="flex h-full flex-col rounded-[32px] border border-neutral-200 bg-white shadow-sm transition group-hover:-translate-y-1 group-hover:shadow-xl">
                    <div className="relative overflow-hidden rounded-[28px]">
                      <img
                        src={artwork.imageUrl}
                        alt={artwork.title}
                        className="w-full h-auto transition duration-700 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2 text-sm font-semibold text-neutral-900">
                          작품 보기 <FiArrowRight />
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-6">
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-neutral-500">
                        <span>{artwork.mainTheme || '테마'}</span>
                        <ArtworkStatusBadge status={artwork.status} />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-neutral-900">{artwork.title}</h3>
                        <p className="text-sm text-neutral-500">{artwork.artistDisplayName || artwork.artistName || '알 수 없음'}</p>
                      </div>
                      <p className="text-sm text-neutral-500">{artwork.size || '사이즈 정보 없음'}</p>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.35em] text-neutral-400">가격</p>
                          <p className="text-lg font-semibold">{formatPrice(artwork.price)}</p>
                        </div>
                        {artwork.isRentable && (
                          <p className="text-xs font-medium text-amber-700">렌탈 {formatPrice(artwork.rentPrice ?? 0)} /월</p>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[32px] border border-dashed border-neutral-300 bg-neutral-50 p-16 text-center text-neutral-500">
              조건에 맞는 작품이 없습니다. 필터를 조정해보세요.
            </div>
          )}

          {artworks.length > 0 && paginationControls}
        </section>
      </section>
    </main>
  );
}