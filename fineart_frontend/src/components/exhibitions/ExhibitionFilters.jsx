'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

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

export default function ExhibitionFilters({ categories, activeCategory, initialKeyword }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(initialKeyword ?? '');
  const [isPending, startTransition] = useTransition();

  const handleCategoryClick = (value) => {
    startTransition(() =>
      router.push(
        buildNextUrl(pathname, searchParams, {
          category: value || undefined,
          page: 1,
        }),
      ),
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = keyword.trim();
    startTransition(() =>
      router.push(
        buildNextUrl(pathname, searchParams, {
          keyword: trimmed || undefined,
          page: 1,
        }),
      ),
    );
  };

  const handleReset = () => {
    setKeyword('');
    startTransition(() =>
      router.push(
        buildNextUrl(pathname, searchParams, {
          keyword: undefined,
          category: undefined,
          page: 1,
        }),
      ),
    );
  };

  return (
    <section className="flex flex-col gap-4 rounded-[32px] border border-neutral-100 bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-wrap gap-2">
        {categories.map(({ value, label }) => {
          const normalizedValue = value ?? '';
          const isActive = (activeCategory ?? '') === normalizedValue;
          return (
            <button
              key={normalizedValue || 'all'}
              type="button"
              onClick={() => handleCategoryClick(normalizedValue)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                isActive
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900'
              }`}
              >
                {label}
              </button>
            );
          })}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="전시 제목, 작가, 장소 검색"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          className="flex-1 rounded-[24px] border border-neutral-200 px-4 py-3 text-sm focus:border-neutral-900 focus:outline-none"
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-[24px] bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
          >
            검색
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-[24px] border border-neutral-200 px-4 py-2.5 text-sm text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900"
          >
            초기화
          </button>
        </div>
      </form>
    </section>
  );
}
