'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function ExhibitionPagination({ page, size, total }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(Math.max(total, 0) / Math.max(size, 1)));

  if (totalPages <= 1) {
    return null;
  }

  const goToPage = (nextPage) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('page', String(clamp(nextPage, 1, totalPages)));
    router.push(`${pathname}?${params.toString()}`);
  };

  const windowStart = clamp(page - 2, 1, totalPages);
  const windowEnd = clamp(page + 2, 1, totalPages);
  const pageNumbers = [];
  for (let cursor = windowStart; cursor <= windowEnd; cursor += 1) {
    pageNumbers.push(cursor);
  }

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => goToPage(page - 1)}
        disabled={page <= 1}
        className="h-10 rounded-full border border-neutral-200 px-4 text-sm text-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        이전
      </button>
      {pageNumbers.map((pageNumber) => {
        const isActive = pageNumber === page;
        return (
          <button
            key={pageNumber}
            type="button"
            onClick={() => goToPage(pageNumber)}
            className={`h-10 w-10 rounded-full border text-sm font-medium transition ${
              isActive
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-200 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900'
            }`}
          >
            {pageNumber}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => goToPage(page + 1)}
        disabled={page >= totalPages}
        className="h-10 rounded-full border border-neutral-200 px-4 text-sm text-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        다음
      </button>
    </nav>
  );
}
