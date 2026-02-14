'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiChevronDown, FiPlus, FiRefreshCcw, FiSearch } from 'react-icons/fi';
import useDecodedAuth from '@/hooks/useDecodedAuth';
import LoadingSpinner from '@/components/LoadingSpinner';
import { createBoard, getBoards } from '@/lib/api';
import { notifyBoardsUpdated } from '@/lib/boardEvents';

const DEFAULT_PAGE_SIZE = 20;
const defaultFormState = {
  name: '',
  slug: '',
  description: '',
  layoutType: 'list',
  orderIndex: 0,
  parentId: '',
  isVisible: true,
};

const layoutOptions = [
  { value: 'list', label: '리스트형' },
  { value: 'gallery', label: '갤러리형' },
  { value: 'media', label: '미디어형' },
  { value: 'timeline', label: '타임라인형' },
];

const normalizeLayoutType = (value) => {
  const normalized = (value ?? 'list').toLowerCase();
  return normalized === 'table' ? 'list' : normalized;
};

const LAYOUT_LABELS = {
  table: '리스트형',
  card: '갤러리형', // 레거시 표시용
  list: '리스트형',
  gallery: '갤러리형',
  media: '미디어형',
  timeline: '타임라인형',
};

const normalizeBoards = (items = []) =>
  items.map((item, index) => ({
    id: item.id ?? index + 1,
    name: item.name ?? '제목 미정',
    slug: item.slug ?? `board-${index + 1}`,
    description: item.description ?? '소개 문구가 준비 중입니다.',
    articleCount:
      item.articleCount ?? item.articlesCount ?? item.postsCount ?? item.count ?? 0,
    createdAt: item.createdAt ?? null,
    updatedAt: item.updatedAt ?? null,
    layoutType: normalizeLayoutType(item.layoutType),
    orderIndex: item.orderIndex ?? index,
    parentId: item.parentId ?? null,
    isVisible: item.isVisible ?? true,
  }));

const attachParentNames = (boards) => {
  const map = new Map(boards.map((board) => [board.id, board]));
  return boards.map((board) => ({
    ...board,
    parentName: board.parentId ? map.get(board.parentId)?.name ?? null : null,
  }));
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
};

export default function BoardsDirectoryClient({ initialData }) {
  const { decodedRole, isAuthenticated } = useDecodedAuth();
  const isAdmin = decodedRole === 'admin';

  const [boards, setBoards] = useState(
    attachParentNames(normalizeBoards(initialData.items ?? [])),
  );
  const [meta, setMeta] = useState({
    page: initialData.page ?? 1,
    size: initialData.size ?? DEFAULT_PAGE_SIZE,
    total: initialData.total ?? initialData.items?.length ?? 0,
  });
  const [keyword, setKeyword] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(initialData.error ?? null);
  const [success, setSuccess] = useState('');
  const [isFallback, setIsFallback] = useState(initialData.isFallback ?? false);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [form, setForm] = useState({
    ...defaultFormState,
    orderIndex: (initialData.items?.length ?? 0) + 1,
  });
  const [saving, setSaving] = useState(false);

  const searchDebounceRef = useRef(null);

  const keywordRef = useRef(keyword);
  useEffect(() => {
    keywordRef.current = keyword;
  }, [keyword]);

  const fetchBoards = useCallback(
    async (pageOverride = 1, keywordOverride = keywordRef.current) => {
      setSearching(true);
      setError(null);
      try {
        const payload = await getBoards({
          page: pageOverride,
          size: meta.size,
          keyword: keywordOverride?.trim() || undefined,
          sort: 'order',
          includeHidden: isAdmin || undefined,
        });

        const normalized = attachParentNames(normalizeBoards(payload?.items ?? []));
        setBoards(normalized);
        setMeta({
          page: payload?.page ?? pageOverride,
          size: payload?.size ?? meta.size,
          total: payload?.total ?? payload?.items?.length ?? 0,
        });
        setIsFallback(false);
      } catch (err) {
        console.error('[Boards] Failed to fetch:', err);
        setError('게시판을 불러오지 못했습니다.');
      } finally {
        setSearching(false);
      }
    },
    [isAdmin, meta.size],
  );

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      setKeyword(searchValue.trim());
      fetchBoards(1, searchValue.trim());
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchValue, fetchBoards]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(meta.total / meta.size)),
    [meta.total, meta.size],
  );

  const handlePaginate = (direction) => {
    const nextPage =
      direction === 'next' ? Math.min(meta.page + 1, totalPages) : Math.max(meta.page - 1, 1);
    if (nextPage === meta.page) return;
    fetchBoards(nextPage);
  };

  const handleRefresh = () => {
    fetchBoards(meta.page);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('게시판 이름을 입력해 주세요.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || undefined,
        layoutType: form.layoutType,
        orderIndex: Number(form.orderIndex) || 0,
        parentId: form.parentId ? Number(form.parentId) : null,
        isVisible: Boolean(form.isVisible),
      };

      await createBoard(payload);
      setSuccess('새 게시판이 생성되었습니다.');
      setForm({
        ...defaultFormState,
        orderIndex: boards.length + 1,
      });
      setShowCreatePanel(false);
      await fetchBoards(1);
      notifyBoardsUpdated();
    } catch (err) {
      console.error('[Boards] Failed to create:', err);
      setError(err?.response?.data?.message ?? '게시판 생성에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };



  return (
    <div className="screen-padding section mx-auto flex w-full max-w-6xl flex-col gap-8 py-10">
      <header className="space-y-3 rounded-3xl border p-6 shadow-sm bg-[var(--board-bg)]" style={{ borderColor: 'var(--board-border)' }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] font-medium" style={{ color: 'var(--board-text-secondary)' }}>FineArt Board</p>
            <h1 className="text-4xl font-bold" style={{ color: 'var(--board-text)' }}>게시판 아카이브</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-neutral-600">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 transition hover:border-neutral-900 hover:text-neutral-900"
            >
              <FiRefreshCcw />
              새로고침
            </button>
            {isAdmin && !isFallback && (
              <button
                type="button"
                onClick={() => setShowCreatePanel((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2 font-semibold text-white transition hover:bg-neutral-800"
                aria-expanded={showCreatePanel}
              >
                <FiPlus />
                새 게시판 만들기
              </button>
            )}
          </div>
        </div>
        {error && (
          <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
            {success}
          </p>
        )}
      </header>

      <section className="rounded-3xl border p-6 shadow-sm bg-[var(--board-bg)]" style={{ borderColor: 'var(--board-border)' }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--board-text-secondary)' }} />
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="게시판 이름·슬러그 검색"
              className="w-full rounded-full border px-12 py-3 text-sm shadow-inner focus:outline-none bg-[var(--board-bg)]"
              style={{ borderColor: 'var(--board-border)', color: 'var(--board-text)' }}
            />
          </div>
          <p className="text-sm" style={{ color: 'var(--board-text-secondary)' }}>
            총{' '}
            <span className="font-semibold" style={{ color: 'var(--board-text)' }}>{meta.total?.toLocaleString() ?? 0}</span>
            개 게시판
          </p>
        </div>

        <div className="mt-6 overflow-x-auto rounded-3xl bg-[var(--board-bg)]" style={{ border: 'none' }}>
          <table className="min-w-full divide-y text-sm">
            <thead className="text-xs font-medium uppercase tracking-wide" style={{ backgroundColor: 'var(--board-bg-secondary)', color: 'var(--board-text-secondary)', borderBottom: '1px solid var(--board-border)' }}>
              <tr>
                <th className="text-left" style={{ padding: '12px 16px' }}>게시판</th>
                <th className="text-left" style={{ padding: '12px 16px' }}>슬러그</th>
                <th className="text-left" style={{ padding: '12px 16px' }}>레이아웃</th>
                <th className="text-left" style={{ padding: '12px 16px' }}>상위</th>
                <th className="text-right" style={{ padding: '12px 16px' }}>글 수</th>
                <th className="text-left" style={{ padding: '12px 16px' }}>표시</th>
                <th className="text-right" style={{ padding: '12px 16px' }}>순서</th>
                <th className="text-left" style={{ padding: '12px 16px' }}>업데이트</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-[var(--board-bg)]" style={{ borderColor: 'var(--board-border)' }}>
              {boards.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-sm py-12 px-4" style={{ color: 'var(--board-text-secondary)' }}>
                    등록된 게시판이 없습니다. 관리자 로그인 후 새 게시판을 만들어주세요.
                  </td>
                </tr>
              ) : (
                boards.map((board) => (
                  <tr
                    key={board.id}
                    className="align-top transition hover:bg-[var(--board-row-hover)]"
                    style={{ borderBottom: '1px solid var(--board-border)' }}
                  >
                    <td className="px-4 py-4" style={{ padding: '16px', color: 'var(--board-text)' }}>
                      <Link
                        href={`/boards/${board.slug}`}
                        className="font-semibold hover:opacity-80"
                        style={{ color: 'var(--board-text)' }}
                      >
                        {board.name}
                      </Link>
                      <p className="text-xs mt-1" style={{ color: 'var(--board-text-secondary)' }}>{board.description}</p>
                    </td>
                    <td className="px-4 py-4" style={{ padding: '16px', color: 'var(--board-text-secondary)' }}>/{board.slug}</td>
                    <td className="px-4 py-4" style={{ padding: '16px', color: 'var(--board-text-secondary)' }}>
                      {LAYOUT_LABELS[board.layoutType] ?? '카드형'}
                    </td>
                    <td className="px-4 py-4" style={{ padding: '16px', color: 'var(--board-text-secondary)' }}>
                      {board.parentName ?? '-'}
                    </td>
                    <td className="px-4 py-4 text-right" style={{ padding: '16px', color: 'var(--board-text)' }}>
                      {board.articleCount?.toLocaleString() ?? 0}
                    </td>
                    <td className="px-4 py-4" style={{ padding: '16px' }}>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          board.isVisible
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-[var(--board-bg-secondary)]'
                        }`}
                        style={!board.isVisible ? { color: 'var(--board-text-secondary)' } : undefined}
                      >
                        {board.isVisible ? '표시' : '숨김'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right" style={{ padding: '16px', color: 'var(--board-text-secondary)' }}>
                      {board.orderIndex ?? 0}
                    </td>
                    <td className="px-4 py-4" style={{ padding: '16px', color: 'var(--board-text-secondary)' }}>
                      {board.updatedAt ? formatDate(board.updatedAt) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {boards.length === 0 && !searching && (
          <div className="mt-6 space-y-3 rounded-3xl border border-dashed border-neutral-300 bg-white/70 p-6 text-center text-sm text-neutral-700 shadow-sm">
            <p>아직 게시판이 없습니다. 관리자 계정으로 로그인한 뒤 게시판을 생성해주세요.</p>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowCreatePanel(true)}
                className="inline-flex items-center justify-center rounded-full border border-neutral-900 px-5 py-2 text-sm font-semibold text-neutral-900 transition hover:-translate-y-0.5 hover:bg-neutral-900 hover:text-white"
              >
                새 게시판 만들기
              </button>
            )}
          </div>
        )}

        {searching && (
          <div className="mt-8 flex justify-center">
            <LoadingSpinner label="게시판을 불러오는 중입니다..." />
          </div>
        )}

        <div className="mt-8 flex flex-col items-center gap-3 text-sm text-neutral-600 md:flex-row md:justify-between">
          <p>
            {meta.page} / {totalPages} 페이지
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handlePaginate('prev')}
              className="rounded-full border border-neutral-200 px-4 py-2 transition hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-40"
              disabled={meta.page <= 1}
            >
              이전
            </button>
            <button
              type="button"
              onClick={() => handlePaginate('next')}
              className="rounded-full border border-neutral-200 px-4 py-2 transition hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-40"
              disabled={meta.page >= totalPages}
            >
              다음
            </button>
          </div>
        </div>
      </section>

      {isAdmin && (
        <section className="space-y-4 rounded-3xl border border-dashed border-neutral-300 bg-white/70 p-6 shadow-sm">
          <button
            type="button"
            onClick={() => setShowCreatePanel((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 px-4 py-3 text-left text-sm font-semibold text-neutral-800 transition hover:border-neutral-900"
            aria-expanded={showCreatePanel}
          >
            <span>{showCreatePanel ? '새 게시판 만들기 접기' : '새 게시판 만들기 펼치기'}</span>
            <FiChevronDown className={`transition ${showCreatePanel ? 'rotate-180' : 'rotate-0'}`} />
          </button>

          {showCreatePanel && (
            <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-neutral-700">
                  게시판 이름
                  <input
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2 focus:border-neutral-900 focus:outline-none"
                    placeholder="예: 공지사항"
                  />
                </label>
                <label className="block text-sm font-medium text-neutral-700">
                  슬러그
                  <input
                    value={form.slug}
                    onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2 focus:border-neutral-900 focus:outline-none"
                    placeholder="예: notice"
                  />
                </label>
              </div>
              <label className="block text-sm font-medium text-neutral-700">
                설명
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  className="mt-1 min-h-[90px] w-full rounded-2xl border border-neutral-200 px-4 py-2 focus:border-neutral-900 focus:outline-none"
                  placeholder="게시판 안내 문구"
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-neutral-700">
                  레이아웃
                  <select
                    value={form.layoutType}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, layoutType: event.target.value }))
                    }
                    className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2 focus:border-neutral-900 focus:outline-none"
                  >
                    {layoutOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-neutral-700">
                  표시 순서
                  <input
                    type="number"
                    value={form.orderIndex}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, orderIndex: Number(event.target.value) }))
                    }
                    className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2 focus:border-neutral-900 focus:outline-none"
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-neutral-700">
                  상위 게시판
                  <select
                    value={form.parentId}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, parentId: event.target.value }))
                    }
                    className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2 focus:border-neutral-900 focus:outline-none"
                  >
                    <option value="">(없음)</option>
                    {boards.map((board) => (
                      <option key={board.id} value={board.id}>
                        {board.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                  <input
                    type="checkbox"
                    checked={form.isVisible}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, isVisible: event.target.checked }))
                    }
                    className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  메뉴에 표시
                </label>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreatePanel(false);
                    setForm({
                      ...defaultFormState,
                      orderIndex: boards.length + 1,
                    });
                  }}
                  className="rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-600"
                  disabled={saving}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
                >
                  {saving ? '저장중...' : '생성하기'}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

    </div>
  );
}
