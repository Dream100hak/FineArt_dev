'use client';

import Link from 'next/link';
import { formatKoreanDate } from '@/lib/date';

const fallbackImage = (seed = 0) =>
  `https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=${760 + seed}&q=80`;

const CATEGORY_ALIASES = {
  notice: 'notice',
  공지: 'notice',
  공지사항: 'notice',
  general: 'general',
  일반: 'general',
};

const CATEGORY_LABELS = {
  notice: 'NOTICE',
  general: 'GENERAL',
};

const resolveImage = (article, index) =>
  article?.imageUrl || article?.thumbnailUrl || fallbackImage(index * 13);

const resolveCategory = (value) => {
  if (!value) return '카테고리';
  const raw = value.toString().trim();
  const alias = CATEGORY_ALIASES[raw.toLowerCase()] ?? CATEGORY_ALIASES[raw];
  if (alias && CATEGORY_LABELS[alias]) {
    return CATEGORY_LABELS[alias];
  }
  return raw;
};

export default function ShowcaseBoard({ board, articles }) {
  const slug = board?.slug ?? '';
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {articles.map((article, index) => {
        const image = resolveImage(article, index);
        return (
          <Link
            key={article.id}
            href={`/boards/${slug}/${article.id}`}
            className="group block overflow-hidden rounded-3xl border shadow-sm transition hover:-translate-y-1 hover:shadow-lg bg-[var(--board-bg)]"
            style={{ borderColor: 'var(--board-border)' }}
          >
            <div className="aspect-[4/3] w-full overflow-hidden bg-[var(--board-bg-secondary)]">
              <img
                src={image}
                alt={article.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="space-y-2 px-5 pb-5 pt-4">
              <p className="text-[11px] uppercase tracking-[0.25em] font-medium" style={{ color: 'var(--board-text-secondary)' }}>
                {resolveCategory(article.category)}
              </p>
              <h3 className="text-xl font-semibold line-clamp-2" style={{ color: 'var(--board-text)' }}>{article.title}</h3>
              <div className="flex items-center justify-between text-xs" style={{ color: 'var(--board-text-secondary)' }}>
                <span>
                  {article.writer ?? 'FineArt'} · {formatKoreanDate(article.createdAt)}
                </span>
                <span>조회 {article.views?.toLocaleString?.() ?? article.views ?? 0}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
