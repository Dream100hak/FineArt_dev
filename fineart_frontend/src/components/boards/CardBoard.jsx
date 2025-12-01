'use client';

import Link from 'next/link';
import { formatKoreanDate } from '@/lib/date';

export default function CardBoard({ board, articles }) {
  const slug = board?.slug ?? '';
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {articles.map((article) => (
        <article
          key={article.id}
          className="flex flex-col justify-between rounded-3xl border border-neutral-100 bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:border-neutral-900"
        >
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
              {article.category || '카테고리'}
            </p>
            <Link
              href={`/boards/${slug}/${article.id}`}
              className="text-2xl font-semibold text-neutral-900 hover:underline"
            >
              {article.title}
            </Link>
            <p className="text-sm text-neutral-600 line-clamp-3">{article.excerpt}</p>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
            <span>
              {article.writer} · {formatKoreanDate(article.createdAt)}
            </span>
            <span>조회 {article.views?.toLocaleString?.() ?? article.views}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
