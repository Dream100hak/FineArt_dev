'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import useDecodedAuth from '@/hooks/useDecodedAuth';

const buildNextUrl = (pathname, searchParams, updates) => {
  const params = new URLSearchParams(searchParams.toString());
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });
  return `${pathname}?${params.toString()}`;
};

export default function ArticleFilters({
  categories,
  activeCategory,
  initialKeyword,
  pageSize,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, decodedRole } = useDecodedAuth();
  const isAdmin = decodedRole === 'admin';
  const [keyword, setKeyword] = useState(initialKeyword ?? '');
  const [isPending, startTransition] = useTransition();

  const handleCategoryClick = (value) => {
    const updates = { category: value, page: 1 };
    startTransition(() => router.push(buildNextUrl(pathname, searchParams, updates)));
  };

  const handleKeywordSubmit = (event) => {
    event.preventDefault();
    const trimmed = keyword.trim();
    const updates = { keyword: trimmed || undefined, page: 1 };
    startTransition(() => router.push(buildNextUrl(pathname, searchParams, updates)));
  };

  const handleSizeChange = (event) => {
    const value = Number(event.target.value);
    const updates = { size: value, page: 1 };
    startTransition(() => router.push(buildNextUrl(pathname, searchParams, updates)));
  };

  const handleWriteClick = () => {
    if (!isAuthenticated) {
      alert('로그인이 필요하거나 권한이 없습니다.');
      router.push('/login');
      return;
    }

    if (!isAdmin) {
      alert('로그인이 필요하거나 권한이 없습니다.');
      return;
    }

    router.push('/admin/articles');
  };

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-neutral-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const isActive = (activeCategory ?? '') === category.value;
            return (
              <button
                key={category.value ?? 'all'}
                type="button"
                onClick={() => handleCategoryClick(category.value ?? '')}
                className={`rounded-full border px-4 py-1 text-sm transition ${
                  isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-neutral-200 text-neutral-600 hover:border-primary hover:text-primary'
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={handleWriteClick}
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            글쓰기
          </button>
        )}
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <form onSubmit={handleKeywordSubmit} className="flex flex-1 items-center gap-2">
          <input
            type="search"
            placeholder="검색어를 입력하세요"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="w-full rounded-2xl border border-neutral-200 px-4 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-2xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
            disabled={isPending}
          >
            검색
          </button>
        </form>
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <span>페이지당</span>
          <select
            value={pageSize}
            onChange={handleSizeChange}
            className="rounded-2xl border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            {[6, 12, 18].map((size) => (
              <option key={size} value={size}>
                {size}개
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
