'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useDecodedAuth from '@/hooks/useDecodedAuth';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getBoardArticles } from '@/lib/api';
import ListBoard from '@/components/boards/ListBoard';
import MediaBoard from '@/components/boards/MediaBoard';
import TimelineBoard from '@/components/boards/TimelineBoard';
import ShowcaseBoard from '@/components/boards/ShowcaseBoard';

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
  return {
    id: article.id ?? article.Id ?? `article-${index}`,
    title: article.title ?? '제목 미정',
    content,
    excerpt: plainExcerpt || '내용을 불러오지 못했습니다.',
    writer: article.author ?? article.writer ?? 'FineArt',
    category: isNoticeFlag ? 'notice' : normalizeCategoryValue(rawCategory),
    createdAt: article.createdAt ?? article.updatedAt ?? article.UpdatedAt ?? new Date().toISOString(),
    views: article.views ?? 0,
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
  const { decodedRole, isAuthenticated } = useDecodedAuth();
  const isAdmin = decodedRole === 'admin';
  const canWrite = isAuthenticated && !initialData?.isFallback;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const normalizedInitialArticles = useMemo(
    () => sortArticles((initialData.items ?? []).map(normalizeArticle).filter(Boolean)),
    [initialData.items],
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
  const [searchField, setSearchField] = useState('title');
  const [searchValue, setSearchValue] = useState('');

  const fetchArticles = useCallback(
    async (pageOverride = 1) => {
      setLoading(true);
      setError(null);
      try {
        const payload = await getBoardArticles(board.slug, {
          page: pageOverride,
          size: meta.size,
        });

        setArticles(sortArticles((payload?.items ?? []).map(normalizeArticle).filter(Boolean)));
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
    [board.slug, meta.size],
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
  const normalizedSearch = searchValue.trim().toLowerCase();
  const filteredArticles = useMemo(() => {
    if (!normalizedSearch) return articles;
    return articles.filter((article) => {
      const target =
        searchField === 'writer'
          ? article.writer ?? ''
          : article.title ?? '';
      return target.toString().toLowerCase().includes(normalizedSearch);
    });
  }, [articles, normalizedSearch, searchField]);
  const displayTotal =
    normalizedSearch && Number.isFinite(filteredArticles.length)
      ? filteredArticles.length
      : meta.total ?? filteredArticles.length;

  const handlePageChange = (direction) => {
    const nextPage =
      direction === 'next' ? Math.min(meta.page + 1, totalPages) : Math.max(meta.page - 1, 1);
    if (nextPage === meta.page) return;
    fetchArticles(nextPage);
  };

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

    if (filteredArticles.length === 0) {
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
        articles={filteredArticles}
        meta={meta}
      />
    );
  };

  return (
    <div className="w-full bg-[var(--board-bg)]">
      <header
        className="w-full border-b shadow-sm bg-[var(--board-bg)] py-5 px-4"
        style={{ borderColor: 'var(--board-border)' }}
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
              {mounted ? (
                canWrite ? (
                  <Link
                    href={`/boards/${board.slug}/write`}
                    className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2 font-semibold text-white transition hover:bg-neutral-800"
                  >
                    글쓰기
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="rounded-full border border-neutral-200 px-4 py-2 text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900"
                  >
                    로그인 후 글쓰기
                  </Link>
                )
              ) : (
                <Link
                  href="/login"
                  className="rounded-full border border-neutral-200 px-4 py-2 text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900"
                >
                  로그인 후 글쓰기
                </Link>
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
        <section className="space-y-3 rounded-lg border p-4 bg-[var(--board-bg)]" style={{ borderColor: 'var(--board-border)' }}>
            <form
              className="flex flex-col gap-2 rounded-lg border p-3 text-sm md:flex-row md:items-center md:gap-3 bg-[var(--board-bg-secondary)]"
              style={{ borderColor: 'var(--board-border)', color: 'var(--board-text-secondary)' }}
              onSubmit={(event) => event.preventDefault()}
            >
              <div className="flex items-center gap-2">
                <label className="text-xs uppercase tracking-[0.25em] font-medium">검색 기준</label>
                <select
                  value={searchField}
                  onChange={(event) => setSearchField(event.target.value)}
                  className="rounded-xl border px-3 py-2 text-sm focus:outline-none bg-[var(--board-bg)]"
                  style={{ borderColor: 'var(--board-border)', color: 'var(--board-text)' }}
                >
                  <option value="title">글 제목</option>
                  <option value="writer">작성자</option>
                </select>
              </div>
              <div className="flex flex-1 items-center gap-3">
                <input
                  type="search"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="검색어를 입력하세요"
                  className="flex-1 rounded-xl border px-4 py-2 text-sm focus:outline-none bg-[var(--board-bg)]"
                  style={{ borderColor: 'var(--board-border)', color: 'var(--board-text)' }}
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={() => setSearchValue('')}
                    className="rounded-full border px-4 py-2 text-sm transition hover:opacity-80"
                    style={{ borderColor: 'var(--board-border)', color: 'var(--board-text-secondary)' }}
                  >
                    초기화
                  </button>
                )}
              </div>
            </form>

            {renderContent()}

            {!normalizedSearch && (
              <div className="flex flex-col items-center gap-3 text-sm md:flex-row md:justify-between" style={{ color: 'var(--board-text-secondary)' }}>
                <p>
                  {meta.page} / {totalPages} 페이지
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handlePageChange('prev')}
                    className="rounded-full border border-neutral-200 px-4 py-2 transition hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-40"
                    disabled={meta.page <= 1}
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePageChange('next')}
                    className="rounded-full border border-neutral-200 px-4 py-2 transition hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-40"
                    disabled={meta.page >= totalPages}
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
        </section>
      </div>
    </div>
  );
}
