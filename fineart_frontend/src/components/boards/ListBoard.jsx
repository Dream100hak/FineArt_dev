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

  /* 한신아트 게시판 테이블 양식: header #F5F5F5, border #EEEEEE, row hover #F8F9FA, 공지 plain-text */
  return (
    <div className="bg-[var(--board-bg)] shadow-sm" style={{ border: 'none' }}>
      <div
        className="hidden sm:grid sm:grid-cols-[90px_110px_1fr_140px_120px_80px] border-b text-xs font-medium uppercase tracking-wide"
        style={{
          backgroundColor: 'var(--board-bg-secondary)',
          color: 'var(--board-text-secondary)',
          padding: '12px 16px',
          borderBottomColor: 'var(--board-border)',
        }}
      >
        <span>{TABLE_HEADERS.number}</span>
        <span>{TABLE_HEADERS.type}</span>
        <span>{TABLE_HEADERS.title}</span>
        <span>{TABLE_HEADERS.writer}</span>
        <span>{TABLE_HEADERS.date}</span>
        <span className="text-right">{TABLE_HEADERS.views}</span>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--board-border)' }}>
        {articles.map((article, index) => {
          const isPinnedFlag = Boolean(
            article.isPinned ?? article.IsPinned ?? article.isBoard ?? article.IsBoard,
          );
          const normalizedCategory = isPinnedFlag
            ? 'notice'
            : normalizeCategory(article.category);
          const isNotice = normalizedCategory === 'notice';
          if (isNotice) pinnedCount += 1;
          const ord = baseNumber - index;
          const numberDisplay = ord > 0 ? ord : article.id;
          const categoryLabel =
            CATEGORY_LABELS[normalizedCategory] ?? CATEGORY_LABELS[DEFAULT_CATEGORY] ?? normalizedCategory;

          return (
            <div
              key={article.id}
              className={`grid items-center gap-3 text-sm transition sm:grid-cols-[90px_110px_1fr_140px_120px_80px] px-4 py-4 ${
                isNotice ? 'hover:bg-[var(--board-notice-bg-hover)]' : 'hover:bg-[var(--board-row-hover)]'
              }`}
              style={{
                color: 'var(--board-text)',
                backgroundColor: isNotice ? 'var(--board-notice-bg)' : undefined,
              }}
            >
              <div className="text-xs font-medium" style={{ color: 'var(--board-text-secondary)' }}>
                <span>{numberDisplay}</span>
              </div>
              <div className="text-xs sm:text-sm" style={{ color: 'var(--board-text-secondary)' }}>
                {isNotice ? (
                  <span
                    className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: 'var(--board-notice-badge)' }}
                  >
                    {categoryLabel}
                  </span>
                ) : (
                  <>
                    <span className="font-medium">{categoryLabel}</span>
                    <span className="mt-1 block text-[11px] sm:hidden">{numberDisplay}</span>
                  </>
                )}
              </div>
              <div className="min-w-0">
                <Link
                  href={`/boards/${slug}/${article.id}`}
                  className="block truncate font-normal hover:opacity-80"
                  style={{ color: 'var(--board-text)' }}
                >
                  {article.title}
                </Link>
              </div>
              <div style={{ color: 'var(--board-text-secondary)' }}>{article.writer}</div>
              <div style={{ color: 'var(--board-text-secondary)' }}>{formatKoreanDate(article.createdAt)}</div>
              <div className="text-right" style={{ color: 'var(--board-text-secondary)' }}>
                {article.views?.toLocaleString?.() ?? article.views}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
