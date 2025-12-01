'use client';

import Link from 'next/link';
import { formatKoreanDate } from '@/lib/date';

const CATEGORY_LABELS = {
  notice: '공지',
  general: '일반',
};

const CATEGORY_ALIASES = {
  notice: 'notice',
  general: 'general',
  공지: 'notice',
  공지사항: 'notice',
  일반: 'general',
  1: 'notice',
  0: 'general',
  true: 'notice',
  false: 'general',
  '1': 'notice',
  '0': 'general',
};

const TABLE_HEADERS = {
  number: '번호',
  type: '구분',
  title: '제목',
  writer: '작성자',
  date: '작성일',
  views: '조회',
};

const DEFAULT_CATEGORY = 'general';

const normalizeCategory = (value) => {
  const rawValue = value ?? DEFAULT_CATEGORY;
  const raw = rawValue.toString().trim();
  if (!raw) return DEFAULT_CATEGORY;
  const lower = raw.toLowerCase();
  const alias = CATEGORY_ALIASES[raw] ?? CATEGORY_ALIASES[lower];
  if (alias) return alias;
  return lower === 'general' || raw === '일반' ? 'general' : 'notice';
};

export default function ListBoard({ board, articles, meta }) {
  const slug = board?.slug ?? '';
  const metaPage = meta?.page ?? 1;
  const fallbackSize = articles.length || 1;
  const metaSize = meta?.size ?? fallbackSize;
  const metaTotal = meta?.total ?? articles.length;
  const baseNumber = metaTotal - (metaPage - 1) * metaSize;
  let pinnedCount = 0;

  return (
    <div className="rounded-3xl border border-neutral-100 bg-white shadow-sm">
      <div className="hidden px-5 py-3 text-xs font-semibold uppercase text-neutral-500 sm:grid sm:grid-cols-[90px_110px_1fr_140px_120px_80px]">
        <span>{TABLE_HEADERS.number}</span>
        <span>{TABLE_HEADERS.type}</span>
        <span>{TABLE_HEADERS.title}</span>
        <span>{TABLE_HEADERS.writer}</span>
        <span>{TABLE_HEADERS.date}</span>
        <span className="text-right">{TABLE_HEADERS.views}</span>
      </div>
      <div className="divide-y divide-neutral-100">
        {articles.map((article, index) => {
          const isNoticeFlag = Boolean(
            article.isPinned ?? article.IsPinned ?? article.isBoard ?? article.IsBoard,
          );
          let numberLabel;
          if (isNoticeFlag) {
            numberLabel = CATEGORY_LABELS.notice;
            pinnedCount += 1;
          } else {
            const ord = baseNumber - (index - pinnedCount);
            numberLabel = ord > 0 ? ord : article.id;
          }

          const normalizedCategory = isNoticeFlag
            ? 'notice'
            : normalizeCategory(article.category);
          const categoryLabel =
            CATEGORY_LABELS[normalizedCategory] ?? CATEGORY_LABELS[DEFAULT_CATEGORY] ?? normalizedCategory;
          const categoryBadgeClass =
            normalizedCategory === 'notice'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-neutral-100 text-neutral-600 border border-neutral-200';

          return (
            <div
              key={article.id}
              className={`grid items-center gap-3 px-5 py-3 text-sm transition hover:bg-neutral-50 sm:grid-cols-[90px_110px_1fr_140px_120px_80px] ${
                article.isPinned ? 'bg-rose-50/80' : ''
              }`}
            >
              <div className="text-xs font-semibold text-neutral-500">
                {article.isPinned ? (
                  <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-100 px-2 py-0.5 text-rose-700">
                    {CATEGORY_LABELS.notice}
                  </span>
                ) : (
                  <span>{numberLabel}</span>
                )}
              </div>
              <div className="text-xs sm:text-sm">
                <span
                  className={`inline-flex rounded-full px-3 py-1 font-semibold ${categoryBadgeClass}`}
                >
                  {categoryLabel}
                </span>
                {!article.isPinned && (
                  <span className="mt-1 block text-[11px] text-neutral-400 sm:hidden">{numberLabel}</span>
                )}
              </div>
              <div className="min-w-0">
                <Link
                  href={`/boards/${slug}/${article.id}`}
                  className="block truncate text-base font-semibold text-neutral-900 hover:text-neutral-600"
                >
                  {article.title}
                </Link>
              </div>
              <div className="text-neutral-600">{article.writer}</div>
              <div className="text-neutral-500">{formatKoreanDate(article.createdAt)}</div>
              <div className="text-right text-neutral-600">
                {article.views?.toLocaleString?.() ?? article.views}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
