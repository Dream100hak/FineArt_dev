'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getArticleCommentsTotal, getBoardArticles, getBoardPageByDate } from '@/lib/api';
import BoardListControls from '@/components/boards/BoardListControls';
import ListBoard from '@/components/boards/ListBoard';
import useDecodedAuth from '@/hooks/useDecodedAuth';
import { formatWriterWithIp } from '@/lib/guestIdentity';

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

const normalizeRelatedArticle = (article, isAuthenticated) => {
  const writer = article?.writer ?? article?.author ?? 'FineArt';
  const guestIp = article?.guestIp ?? article?.guest_ip ?? '';
  return {
    id: article?.id,
    title: article?.title ?? '제목 미정',
    category: normalizeCategoryValue(article?.category),
    isPinned: Boolean(article?.isPinned ?? article?.is_pinned),
    createdAt: article?.createdAt ?? article?.created_at,
    views: article?.viewCount ?? article?.view_count ?? article?.views ?? 0,
    writer,
    writerDisplay: formatWriterWithIp(writer, guestIp),
  };
};

export default function RelatedArticlesList({ board, items, excludeArticleId }) {
  const { isAuthenticated } = useDecodedAuth();
  const [searchField, setSearchField] = useState('all');
  const [searchValue, setSearchValue] = useState('');
  const [appliedSearchField, setAppliedSearchField] = useState('all');
  const [appliedSearchValue, setAppliedSearchValue] = useState('');
  const [jumpDateTime, setJumpDateTime] = useState('');
  const [jumpingByDate, setJumpingByDate] = useState(false);
  const [meta, setMeta] = useState({ page: 1, size: 12, total: 0 });
  const [fetchedItems, setFetchedItems] = useState(items ?? []);
  const [loading, setLoading] = useState(false);
  const [commentsTotalById, setCommentsTotalById] = useState({});

  const fetchPage = useCallback(
    async (page = 1, overrides = {}) => {
      if (!board?.slug) return;
      try {
        setLoading(true);
        const effectiveSearchValue = overrides.searchValue ?? appliedSearchValue;
        const effectiveSearchField = overrides.searchField ?? appliedSearchField;
        const payload = await getBoardArticles(board.slug, {
          page,
          size: meta.size,
          keyword: effectiveSearchValue || undefined,
          searchField: effectiveSearchField,
        });
        const allItems = payload?.items ?? [];
        const excluded = excludeArticleId
          ? allItems.filter((item) => String(item.id) !== String(excludeArticleId))
          : allItems;

        setFetchedItems(excluded);
        setMeta({
          page: payload?.page ?? page,
          size: payload?.size ?? meta.size,
          total: payload?.total ?? 0,
        });
      } catch (error) {
        console.error('[Board] Failed to fetch related articles page:', error);
      } finally {
        setLoading(false);
      }
    },
    [appliedSearchField, appliedSearchValue, board?.slug, excludeArticleId, meta.size],
  );

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  const normalizedItems = useMemo(
    () =>
      sortArticles((fetchedItems ?? []).map((item) => normalizeRelatedArticle(item, isAuthenticated))),
    [isAuthenticated, fetchedItems],
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const ids = (normalizedItems ?? []).map((a) => a?.id).filter(Boolean);
        const uniqueIds = Array.from(new Set(ids));
        if (uniqueIds.length === 0) {
          if (!cancelled) setCommentsTotalById({});
          return;
        }

        const results = await Promise.all(
          uniqueIds.map(async (id) => {
            const total = await getArticleCommentsTotal(id);
            return [id, total];
          }),
        );

        if (cancelled) return;
        const map = {};
        results.forEach(([id, total]) => {
          map[id] = total;
        });
        setCommentsTotalById(map);
      } catch (err) {
        console.error('[Board] Failed to load related comments totals:', err);
        if (!cancelled) setCommentsTotalById({});
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [normalizedItems]);

  const totalPages = Math.max(1, Math.ceil((meta.total || 0) / (meta.size || 12)));
  const pageButtons = useMemo(() => {
    const windowSize = 10;
    const currentGroup = Math.floor((meta.page - 1) / windowSize);
    const start = currentGroup * windowSize + 1;
    const end = Math.min(totalPages, start + windowSize - 1);
    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
  }, [meta.page, totalPages]);

  const handlePageSelect = (page) => {
    const nextPage = Math.max(1, Math.min(page, totalPages));
    if (nextPage === meta.page) return;
    fetchPage(nextPage);
  };

  const handleJumpToDate = async () => {
    if (!jumpDateTime || jumpingByDate || !board?.slug) return;
    try {
      setJumpingByDate(true);
      const page = await getBoardPageByDate(board.slug, jumpDateTime, meta.size);
      handlePageSelect(page ?? 1);
    } catch (error) {
      console.error('[Board] Failed to jump related list by date:', error);
    } finally {
      setJumpingByDate(false);
    }
  };

  const handleSearchSubmit = () => {
    const nextValue = searchValue.trim();
    const nextField = searchField;
    setAppliedSearchField(nextField);
    setAppliedSearchValue(nextValue);
    fetchPage(1, { searchValue: nextValue, searchField: nextField });
  };

  const handleSearchClear = () => {
    setSearchValue('');
    setSearchField('all');
    setAppliedSearchField('all');
    setAppliedSearchValue('');
    fetchPage(1, { searchValue: '', searchField: 'all' });
  };

  return (
    <div className="space-y-3">
      {loading ? (
        <p className="px-4 py-6 text-sm" style={{ color: 'var(--board-text-secondary)' }}>
          게시글을 불러오는 중입니다.
        </p>
      ) : normalizedItems.length === 0 ? (
        <p className="px-4 py-6 text-sm" style={{ color: 'var(--board-text-secondary)' }}>
          다른 게시글이 없습니다.
        </p>
      ) : (
        <ListBoard
          board={board}
          articles={(normalizedItems ?? []).map((a) => ({
            ...a,
            commentsTotal: commentsTotalById[a.id] ?? 0,
          }))}
          meta={{ page: meta.page, size: meta.size, total: meta.total }}
        />
      )}

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
        onPrevPage={() => handlePageSelect(meta.page - 1)}
        onSelectPage={handlePageSelect}
        onNextPage={() => handlePageSelect(meta.page + 1)}
        onLastPage={() => handlePageSelect(totalPages)}
        jumpDateTime={jumpDateTime}
        setJumpDateTime={setJumpDateTime}
        onJumpToDate={handleJumpToDate}
        jumpingByDate={jumpingByDate}
      />
    </div>
  );
}
