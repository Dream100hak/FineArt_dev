'use client';

import Link from 'next/link';
import { formatBoardPostDate } from '@/lib/date';

export default function TimelineBoard({ board, articles }) {
  const slug = board?.slug ?? '';
  return (
    <div className="relative border-l-2 pl-6" style={{ borderColor: 'var(--board-border)' }}>
      {articles.map((article, index) => (
        <div key={article.id} className="relative mb-8 last:mb-0">
          <span className="absolute -left-[19px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-[var(--board-text)]" />
          <p className="text-xs" style={{ color: 'var(--board-text-secondary)' }}>{formatBoardPostDate(article.createdAt)}</p>
          <div className="mt-1 flex items-start gap-2">
            <Link
              href={`/boards/${slug}/${article.id}`}
              className="block min-w-0 flex-1 text-xl font-semibold hover:opacity-80"
              style={{ color: 'var(--board-text)' }}
            >
              {article.title}
            </Link>
            {Number(article.commentsTotal ?? 0) > 0 && (
              <span
                className="shrink-0 whitespace-nowrap text-[11px] font-medium text-neutral-500 leading-none mt-2"
                title="댓글 + 답글 수"
                style={{ lineHeight: 1 }}
              >
                [{article.commentsTotal}]
              </span>
            )}
          </div>
          <p className="text-sm" style={{ color: 'var(--board-text-secondary)' }}>{article.excerpt}</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--board-text-secondary)' }}>
            {article.writerDisplay ?? article.writer} | {article.category || '타임라인'}
          </p>
        </div>
      ))}
    </div>
  );
}
