'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getBoardArticles, getBoardPageByDate } from '@/lib/api';
import ListBoard from '@/components/boards/ListBoard';
import MediaBoard from '@/components/boards/MediaBoard';
import TimelineBoard from '@/components/boards/TimelineBoard';
import ShowcaseBoard from '@/components/boards/ShowcaseBoard';
import BoardListControls from '@/components/boards/BoardListControls';
import { formatWriterWithIp } from '@/lib/guestIdentity';
import useDecodedAuth from '@/hooks/useDecodedAuth';

const stripHtml = (value = '') =>
  value
    ?.replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** 본문 HTML에서 첫 번째 img src URL 추출 (갤러리형 등 썸네일 없을 때 사용) */
const extractFirstImageUrl = (html = '') => {
  if (!html || typeof html !== 'string') return '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1]?.trim() ?? '';
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

const normalizeCategoryValue = (value) => {
  const rawValue = value ?? '';
  const raw = rawValue.toString().trim();
  if (!raw) return 'general';

  const lower = raw.toLowerCase();
  const alias = CATEGORY_ALIASES[raw] ?? CATEGORY_ALIASES[lower];
  if (alias) return alias;
  return lower === 'general' || raw === '일반' ? 'general' : 'notice';
};

const pickCategoryValue = (article = {}) => {
  const candidates = [
    article.category,
    article.Category,
    article.type,
    article.Type,
    article.articleType,
    article.ArticleType,
    article.categoryName,
    article.CategoryName,
    article.categoryId,
    article.CategoryId,
    article.categoryCode,
    article.CategoryCode,
    article.notice,
    article.Notice,
  ];

  const found = candidates.find((value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    return true;
  });

  return found ?? '';
};

const normalizeArticle = (article, index) => {
  if (!article) return null;
  const boardInfo = article.board ?? article.Board ?? {};
  const content = article.content ?? '';
  const excerptSource = article.excerpt ?? content;
  const plainExcerpt = stripHtml(excerptSource)?.slice(0, 160) ?? '';
  const rawCategory = pickCategoryValue(article);
  const isNoticeFlag = Boolean(article.isPinned ?? article.IsPinned ?? article.isBoard ?? article.IsBoard);
  const resolvedWriter = article.writer ?? article.author ?? 'FineArt';
  return {
    id: article.id ?? article.Id ?? `article-${index}`,
    title: article.title ?? '제목 미정',
    content,
    excerpt: plainExcerpt || '내용을 불러오지 못했습니다.',
    writer: resolvedWriter,
    guestIp: article.guestIp ?? article.guest_ip ?? '',
    writerDisplay: formatWriterWithIp(
      resolvedWriter,
      article.guestIp ?? article.guest_ip,
    ),
    category: isNoticeFlag ? 'notice' : normalizeCategoryValue(rawCategory),
    createdAt: article.createdAt ?? article.updatedAt ?? article.UpdatedAt ?? new Date().toISOString(),
    views: article.viewCount ?? article.view_count ?? article.views ?? 0,
    boardSlug: boardInfo.slug ?? article.boardSlug ?? boardInfo?.Slug ?? '',
    imageUrl: article.imageUrl ?? article.heroImage ?? '',
    thumbnailUrl:
      article.thumbnailUrl ??
      article.thumbUrl ??
      extractFirstImageUrl(article.content ?? '') ??
      '',
    isPinned: isNoticeFlag,
  };
};

const sortArticles = (items) => {
  const getPriority = (article) => {
    const isNoticeCategory = (article.category ?? '').toString().toLowerCase() === 'notice';
    return (article.isPinned ? 2 : 0) + (isNoticeCategory ? 1 : 0);
  };

  return [...items].sort((a, b) => {
    const priorityDiff = getPriority(b) - getPriority(a);
    if (priorityDiff !== 0) return priorityDiff;
    const dateDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (dateDiff !== 0) return dateDiff;
    return (Number(b.id) || 0) - (Number(a.id) || 0);
  });
};

export default function BoardArticlesClient({ board, initialData }) {
  const { isAuthenticated } = useDecodedAuth();
  const canWrite = !initialData?.isFallback;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const normalizedInitialArticles = useMemo(
    () =>
      sortArticles(
        (initialData.items ?? [])
          .map((article, index) => {
            const normalized = normalizeArticle(article, index);
            if (!normalized) return null;
            return {
              ...normalized,
              writerDisplay: formatWriterWithIp(normalized.writer, normalized.guestIp),
            };
          })
          .filter(Boolean),
      ),
    [initialData.items, isAuthenticated],
  );

  const [currentBoard, setCurrentBoard] = useState(initialData.board ?? board);
  const [articles, setArticles] = useState(normalizedInitialArticles);
  const [meta, setMeta] = useState({
    page: initialData.page ?? 1,
    size: initialData.size ?? 12,
    total: initialData.total ?? initialData.items?.length ?? 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialData.error ?? null);
  const [isFallback, setIsFallback] = useState(initialData.isFallback ?? false);
  const [searchField, setSearchField] = useState('all');
  const [searchValue, setSearchValue] = useState('');
  const [appliedSearchField, setAppliedSearchField] = useState('all');
  const [appliedSearchValue, setAppliedSearchValue] = useState('');
  const [jumpDateTime, setJumpDateTime] = useState('');
  const [jumpingByDate, setJumpingByDate] = useState(false);

  const fetchArticles = useCallback(
    async (pageOverride = 1, overrides = {}) => {
      setLoading(true);
      setError(null);
      try {
        const effectiveSearchValue = overrides.searchValue ?? appliedSearchValue;
        const effectiveSearchField = overrides.searchField ?? appliedSearchField;
        const payload = await getBoardArticles(board.slug, {
          page: pageOverride,
          size: meta.size,
          keyword: effectiveSearchValue || undefined,
          searchField: effectiveSearchField,
        });

        setArticles(
          sortArticles(
            (payload?.items ?? [])
              .map((article, index) => {
                const normalized = normalizeArticle(article, index);
                if (!normalized) return null;
                return {
                  ...normalized,
                  writerDisplay: formatWriterWithIp(normalized.writer, normalized.guestIp),
                };
              })
              .filter(Boolean),
          ),
        );
        setMeta({
          page: payload?.page ?? pageOverride,
          size: payload?.size ?? meta.size,
          total: payload?.total ?? payload?.items?.length ?? 0,
        });

        if (payload?.board) {
          setCurrentBoard(payload.board);
        }
        setIsFallback(false);
      } catch (err) {
        console.error('[Board] Failed to fetch articles:', err);
        setError('게시글을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [appliedSearchField, appliedSearchValue, board.slug, isAuthenticated, meta.size],
  );

  useEffect(() => {
    if (initialData?.isFallback) {
      fetchArticles(1);
    }
  }, [initialData?.isFallback, fetchArticles]);

  useEffect(() => {
    setCurrentBoard(initialData.board ?? board);
    setArticles(normalizedInitialArticles);
    setMeta({
      page: initialData.page ?? 1,
      size: initialData.size ?? 12,
      total: initialData.total ?? initialData.items?.length ?? normalizedInitialArticles.length ?? 0,
    });
    setError(initialData.error ?? null);
    setIsFallback(initialData.isFallback ?? false);
  }, [
    board,
    initialData.board,
    initialData.page,
    initialData.size,
    initialData.total,
    initialData.items,
    initialData.error,
    initialData.isFallback,
    normalizedInitialArticles,
  ]);

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.size));
  const displayTotal = meta.total ?? articles.length;

  const handlePageChange = (direction) => {
    const nextPage =
      direction === 'next' ? Math.min(meta.page + 1, totalPages) : Math.max(meta.page - 1, 1);
    if (nextPage === meta.page) return;
    fetchArticles(nextPage);
  };

  const handleSearchSubmit = () => {
    const nextValue = searchValue.trim();
    const nextField = searchField;
    setAppliedSearchField(nextField);
    setAppliedSearchValue(nextValue);
    fetchArticles(1, { searchValue: nextValue, searchField: nextField });
  };

  const handleSearchClear = () => {
    setSearchValue('');
    setAppliedSearchField('all');
    setAppliedSearchValue('');
    setSearchField('all');
    fetchArticles(1, { searchValue: '', searchField: 'all' });
  };

  const handlePageSelect = (page) => {
    const nextPage = Math.max(1, Math.min(page, totalPages));
    if (nextPage === meta.page) return;
    fetchArticles(nextPage);
  };

  const handleJumpToDate = async () => {
    if (!jumpDateTime || jumpingByDate) return;
    try {
      setJumpingByDate(true);
      const page = await getBoardPageByDate(board.slug, jumpDateTime, meta.size);
      handlePageSelect(page ?? 1);
    } catch (err) {
      console.error('[Board] Failed to jump by date:', err);
      setError('날짜 기준 페이지 이동에 실패했습니다.');
    } finally {
      setJumpingByDate(false);
    }
  };

  const pageButtons = useMemo(() => {
    const windowSize = 10;
    const currentGroup = Math.floor((meta.page - 1) / windowSize);
    const start = currentGroup * windowSize + 1;
    const end = Math.min(totalPages, start + windowSize - 1);
    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
  }, [meta.page, totalPages]);

  const layoutComponents = {
    card: ShowcaseBoard, // 레거시: 카드형 제거 후 기존 데이터용
    cards: ShowcaseBoard,
    gallery: ShowcaseBoard,
    table: ListBoard,
    list: ListBoard,
    media: MediaBoard,
    timeline: TimelineBoard,
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-10">
          <LoadingSpinner label="게시글을 불러오는 중입니다..." />
        </div>
      );
    }

    if (articles.length === 0) {
      return (
        <div className="rounded-3xl border border-dashed p-10 text-center text-sm bg-[var(--board-bg)]" style={{ borderColor: 'var(--board-border)', color: 'var(--board-text-secondary)' }}>
          조건에 맞는 게시글이 없습니다. 다른 검색어나 카테고리를 선택해 주세요.
        </div>
      );
    }

    const normalizedLayout = (currentBoard?.layoutType ?? 'list').toLowerCase();
    const layoutKey = normalizedLayout === 'table' ? 'list' : normalizedLayout;
    const LayoutComponent = layoutComponents[layoutKey] ?? ShowcaseBoard;
    return (
      <LayoutComponent
        board={currentBoard ?? board}
        articles={articles}
        meta={meta}
      />
    );
  };

  return (
    <div className="w-full bg-[var(--board-bg)]">
      <header
        className="w-full bg-[var(--board-bg)] py-5"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--board-text)' }}>
                {currentBoard?.name ?? board.name}
              </h1>
              <p className="mt-2 text-sm" style={{ color: 'var(--board-text-secondary)' }}>{currentBoard?.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: 'var(--board-text-secondary)' }}>
              <p>
                게시글{' '}
                <span className="font-semibold" style={{ color: 'var(--board-text)' }}>
                  {displayTotal?.toLocaleString() ?? currentBoard?.articleCount ?? 0}
                </span>
              </p>
              {mounted && canWrite ? (
                <Link
                  href={`/boards/${board.slug}/write`}
                  className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2 font-semibold text-white transition hover:bg-neutral-800"
                >
                  글쓰기
                </Link>
              ) : (
                <span className="rounded-full border border-neutral-200 px-4 py-2 text-neutral-500">
                  현재 글쓰기 준비 중
                </span>
              )}
            </div>
          </div>
          {isFallback && (
              <p className="rounded-2xl bg-amber-50 px-4 py-2 text-xs text-amber-800">
                {initialData?.error ?? '백엔드 연결이 없어 임시 게시글을 표시합니다.'}
              </p>
            )}
            {error && (
              <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
                {error}
              </p>
            )}
        </div>
      </header>

      <div className="flex min-w-0 flex-1 flex-col bg-[var(--board-bg)]">
        <section className="space-y-3 bg-[var(--board-bg)]">
            {renderContent()}

            <BoardListControls
              searchField={searchField}
              setSearchField={setSearchField}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              onSubmitSearch={handleSearchSubmit}
              onClearSearch={handleSearchClear}
              showPagination={!appliedSearchValue && totalPages > 1}
              pageButtons={pageButtons}
              currentPage={meta.page}
              totalPages={totalPages}
              onFirstPage={() => handlePageSelect(1)}
              onPrevPage={() => handlePageChange('prev')}
              onSelectPage={handlePageSelect}
              onNextPage={() => handlePageChange('next')}
              onLastPage={() => handlePageSelect(totalPages)}
              jumpDateTime={jumpDateTime}
              setJumpDateTime={setJumpDateTime}
              onJumpToDate={handleJumpToDate}
              jumpingByDate={jumpingByDate}
            />
        </section>
      </div>
    </div>
  );
}
