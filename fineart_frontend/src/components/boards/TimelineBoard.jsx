'use client';

import Link from 'next/link';
import { formatKoreanDate } from '@/lib/date';

export default function TimelineBoard({ board, articles }) {
  const slug = board?.slug ?? '';
  return (
    <div className="relative border-l-2 pl-6" style={{ borderColor: 'var(--board-border)' }}>
      {articles.map((article, index) => (
        <div key={article.id} className="relative mb-8 last:mb-0">
          <span className="absolute -left-[19px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-[var(--board-text)]" />
          <p className="text-xs" style={{ color: 'var(--board-text-secondary)' }}>{formatKoreanDate(article.createdAt)}</p>
          <Link
            href={`/boards/${slug}/${article.id}`}
            className="mt-1 block text-xl font-semibold hover:opacity-80"
            style={{ color: 'var(--board-text)' }}
          >
            {article.title}
          </Link>
          <p className="text-sm" style={{ color: 'var(--board-text-secondary)' }}>{article.excerpt}</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--board-text-secondary)' }}>
            {article.writer} · {article.category || '타임라인'}
          </p>
        </div>
      ))}
    </div>
  );
}
