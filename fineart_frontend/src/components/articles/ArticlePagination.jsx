'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const clampPage = (value, total) => {
  if (value < 1) return 1;
  if (value > total) return total;
  return value;
};

export default function ArticlePagination({ page, size, total }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / size));

  if (totalPages <= 1) {
    return null;
  }

  const goToPage = (nextPage) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(clampPage(nextPage, totalPages)));
    router.push(`${pathname}?${params.toString()}`);
  };

  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  const pageNumbers = Array.from({ length: end - start + 1 }, (_, index) => start + index);

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
            className={`h-10 w-10 rounded-full border text-sm font-medium ${
              isActive
                ? 'border-primary bg-primary text-white'
                : 'border-neutral-200 text-neutral-600 hover:border-primary hover:text-primary'
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
