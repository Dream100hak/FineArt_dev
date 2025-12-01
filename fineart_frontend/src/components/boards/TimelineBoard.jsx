'use client';

import Link from 'next/link';
import { formatKoreanDate } from '@/lib/date';

export default function TimelineBoard({ board, articles }) {
  const slug = board?.slug ?? '';
  return (
    <div className="relative border-l-2 border-neutral-200 pl-6">
      {articles.map((article, index) => (
        <div key={article.id} className="relative mb-8 last:mb-0">
          <span className="absolute -left-[19px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-neutral-900" />
          <p className="text-xs text-neutral-500">{formatKoreanDate(article.createdAt)}</p>
          <Link
            href={`/boards/${slug}/${article.id}`}
            className="mt-1 block text-xl font-semibold text-neutral-900 hover:underline"
          >
            {article.title}
          </Link>
          <p className="text-sm text-neutral-600">{article.excerpt}</p>
          <p className="mt-1 text-xs text-neutral-500">
            {article.writer} · {article.category || '타임라인'}
          </p>
        </div>
      ))}
    </div>
  );
}
