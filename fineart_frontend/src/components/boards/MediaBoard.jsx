'use client';

import Link from 'next/link';
import { FiPlay } from 'react-icons/fi';
import { formatKoreanDate } from '@/lib/date';

const fallbackThumb = (seed) =>
  `https://picsum.photos/seed/media-${seed}/640/360`;

export default function MediaBoard({ board, articles }) {
  const slug = board?.slug ?? '';
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {articles.map((article, index) => {
        const image = article.thumbnailUrl || article.imageUrl || fallbackThumb(index);
        return (
          <article
            key={article.id}
            className="space-y-3 rounded-3xl border p-4 shadow-sm bg-[var(--board-bg)]"
            style={{ borderColor: 'var(--board-border)' }}
          >
            <Link
              href={`/boards/${slug}/${article.id}`}
              className="group relative block overflow-hidden rounded-2xl"
            >
              <div className="aspect-video w-full bg-[var(--board-bg-secondary)]">
                <img src={image} alt={article.title} className="h-full w-full object-cover" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-white transition group-hover:bg-black/80">
                  <FiPlay />
                </span>
              </div>
            </Link>
            <div className="space-y-1 px-1">
              <p className="text-xs uppercase tracking-[0.3em] font-medium" style={{ color: 'var(--board-text-secondary)' }}>
                {article.category || '미디어'}
              </p>
              <Link
                href={`/boards/${slug}/${article.id}`}
                className="text-lg font-semibold hover:opacity-80"
                style={{ color: 'var(--board-text)' }}
              >
                {article.title}
              </Link>
              <p className="text-sm line-clamp-2" style={{ color: 'var(--board-text-secondary)' }}>{article.excerpt}</p>
              <p className="text-xs" style={{ color: 'var(--board-text-secondary)' }}>
                {formatKoreanDate(article.createdAt)} · {article.writer}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
