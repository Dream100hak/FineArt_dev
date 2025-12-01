'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useDecodedAuth from '@/hooks/useDecodedAuth';
import LoadingSpinner from '@/components/LoadingSpinner';
import { createBoard, deleteBoard, getBoards, updateBoard } from '@/lib/api';
import { notifyBoardsUpdated } from '@/lib/boardEvents';
import LayoutPreview from '@/components/boards/LayoutPreview';

const defaultForm = {
  name: '',
  slug: '',
  description: '',
  layoutType: 'list',
  orderIndex: 0,
  parentId: '',
  isVisible: true,
};

const layoutOptions = [
  { value: 'card', label: '카드형', description: '카드 형태로 강조되는 그리드' },
  { value: 'list', label: '리스트형', description: '간결한 요약 리스트' },
  { value: 'gallery', label: '갤러리형', description: '이미지 썸네일 중심' },
  { value: 'media', label: '미디어형', description: '영상·미디어 콘텐츠용' },
  { value: 'timeline', label: '타임라인형', description: '연혁/이벤트 타임라인' },
];

const FALLBACK_LAYOUT_LABELS = {
  table: '리스트형',
};

const getLayoutLabel = (value) =>
  layoutOptions.find((option) => option.value === value)?.label ??
  FALLBACK_LAYOUT_LABELS[value] ??
  value;

const normalizeLayoutType = (value) => {
  const normalized = (value ?? 'list').toLowerCase();
  return normalized === 'table' ? 'list' : normalized;
};

const normalizeBoards = (items = []) =>
  items.map((item, index) => ({
    id: item.id ?? index + 1,
    name: item.name ?? '이름 미정',
    slug: item.slug ?? `board-${index + 1}`,
    description: item.description ?? '',
    layoutType: normalizeLayoutType(item.layoutType),
    orderIndex: item.orderIndex ?? index,
    parentId: item.parentId ?? null,
    isVisible: item.isVisible ?? true,
    articleCount:
      item.articleCount ?? item.articlesCount ?? item.postsCount ?? item.count ?? 0,
  }));

const attachParentNames = (boards) => {
  const map = new Map(boards.map((board) => [board.id, board]));
  return boards.map((board) => ({
    ...board,
    parentName: board.parentId ? map.get(board.parentId)?.name ?? null : null,
  }));
};

export default function AdminBoardsClient() {
  const searchParams = useSearchParams();
  const { isAuthenticated, decodedRole } = useDecodedAuth();
  const isAdmin = decodedRole === 'admin';
  const canManage = isAuthenticated && isAdmin;

  const [boards, setBoards] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [keyword, setKeyword] = useState('');
  const [pendingPrefillSlug, setPendingPrefillSlug] = useState('');
  const [consumedPrefillSlug, setConsumedPrefillSlug] = useState('');

  const normalizedFormLayoutType = normalizeLayoutType(form.layoutType);
  const selectedLayout = useMemo(
    () => layoutOptions.find((option) => option.value === normalizedFormLayoutType),
    [normalizedFormLayoutType],
  );

  const filteredBoards = useMemo(() => {
    if (!keyword.trim()) return boards;
    const term = keyword.trim().toLowerCase();
    return boards.filter(
      (board) =>
        board.name.toLowerCase().includes(term) ||
        board.slug.toLowerCase().includes(term) ||
        board.description.toLowerCase().includes(term),
    );
  }, [boards, keyword]);

  const fetchBoards = useCallback(async () => {
    if (!canManage) return;
    setLoading(true);
    setError('');
    try {
      const payload = await getBoards({
        size: 200,
        includeHidden: true,
        sort: 'order',
      });
      const normalized = attachParentNames(normalizeBoards(payload?.items ?? []));
      setBoards(normalized);
    } catch (err) {
      console.error('[Admin Boards] fetch failed', err);
      setError('게시판 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  useEffect(() => {
    const slugParam = searchParams?.get('slug')?.trim().toLowerCase() ?? '';
    if (!slugParam || slugParam === consumedPrefillSlug) return;
    setPendingPrefillSlug(slugParam);
  }, [searchParams, consumedPrefillSlug]);

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
      const normalizedLayout = normalizeLayoutType(form.layoutType);
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || undefined,
        layoutType: normalizedLayout,
        orderIndex: Number(form.orderIndex) || 0,
        parentId: form.parentId ? Number(form.parentId) : null,
        isVisible: Boolean(form.isVisible),
      };

      if (editingId) {
        await updateBoard(editingId, payload);
        setSuccess('게시판이 수정되었습니다.');
      } else {
        await createBoard(payload);
        setSuccess('게시판이 생성되었습니다.');
      }

      setForm(defaultForm);
      setEditingId(null);
      await fetchBoards();
      notifyBoardsUpdated();
    } catch (err) {
      console.error('[Admin Boards] save failed', err);
      setError(err?.response?.data?.message ?? '알 수 없는 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (board) => {
    setEditingId(board.id);
    setForm({
      name: board.name ?? '',
      slug: board.slug ?? '',
      description: board.description ?? '',
      layoutType: normalizeLayoutType(board.layoutType),
      orderIndex: board.orderIndex ?? 0,
      parentId: board.parentId ? String(board.parentId) : '',
      isVisible: board.isVisible ?? true,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!pendingPrefillSlug || boards.length === 0) return;
    const match = boards.find((board) => board.slug?.toLowerCase() === pendingPrefillSlug);
    if (match) {
      handleEdit(match);
      setPendingPrefillSlug('');
      setConsumedPrefillSlug(match.slug?.toLowerCase() ?? '');
    }
  }, [boards, pendingPrefillSlug]);

  const handleDelete = async (board) => {
    if (
      !window.confirm(
        `"${board.name}" 게시판을 삭제하면 연결된 게시글까지 모두 삭제됩니다. 계속 진행할까요?`,
      )
    ) {
      return;
    }

    try {
      await deleteBoard(board.id);
      await fetchBoards();
      notifyBoardsUpdated();
    } catch (err) {
      console.error('[Admin Boards] delete failed', err);
      setError(err?.response?.data?.message ?? '게시판 삭제에 실패했습니다.');
    }
  };



  if (!canManage) {
    return (
      <div className="screen-padding section mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-semibold text-neutral-900">접근 권한이 필요합니다.</p>
        <p className="text-sm text-neutral-600">관리자 계정으로 로그인해 주세요.</p>
      </div>
    );
  }

  return (
    <div className="screen-padding section mx-auto flex w-full max-w-6xl flex-col gap-8 py-10">
      <header className="space-y-3 rounded-3xl border border-neutral-200 bg-white/90 p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Board Management</p>
        <h1 className="text-4xl font-semibold text-neutral-900">게시판 관리</h1>
        <p className="text-sm text-neutral-600">
          새 게시판을 만들고 기본 레이아웃과 순서를 설정한 뒤 노출 여부를 손쉽게 조정할 수 있습니다.
        </p>
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

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl border border-neutral-200 bg-white/90 p-6 shadow-sm"
      >

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-neutral-700">
            게시판 이름
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2 focus:border-neutral-900 focus:outline-none"
              placeholder="예: 공지사항"
            />
          </label>
          <label className="text-sm font-medium text-neutral-700">
            슬러그
            <input
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2 focus:border-neutral-900 focus:outline-none"
              placeholder="예: notice"
            />
          </label>
        </div>

        <label className="text-sm font-medium text-neutral-700">
          설명
          <textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="mt-1 min-h-[100px] w-full rounded-2xl border border-neutral-200 px-4 py-2 focus:border-neutral-900 focus:outline-none"
            placeholder="게시판 소개 문구"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">
              레이아웃
              <select
                value={normalizedFormLayoutType}
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
            {selectedLayout?.description && (
              <p className="text-xs text-neutral-500">{selectedLayout.description}</p>
            )}
            <LayoutPreview type={normalizedFormLayoutType} />
          </div>

          <label className="text-sm font-medium text-neutral-700">
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

          <label className="text-sm font-medium text-neutral-700">
            상위 게시판
            <select
              value={form.parentId}
              onChange={(event) => setForm((prev) => ({ ...prev, parentId: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2 focus:border-neutral-900 focus:outline-none"
            >
              <option value="">(없음)</option>
              {boards
                .filter((board) => board.id !== editingId)
                .map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.name}
                  </option>
                ))}
            </select>
          </label>
        </div>

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

        <div className="flex items-center justify-end gap-3">
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(defaultForm);
              }}
              className="rounded-full border border-neutral-300 px-4 py-2 text-sm text-neutral-600 hover:border-neutral-900 hover:text-neutral-900"
              disabled={saving}
            >
              취소
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-neutral-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {saving ? '저장 중...' : editingId ? '게시판 수정' : '게시판 생성'}
          </button>
        </div>
      </form>

      <section className="rounded-3xl border border-neutral-200 bg-white/90 p-6 shadow-sm">
        <form
          className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          onSubmit={(event) => {
            event.preventDefault();
            setKeyword(keyword.trim());
          }}
        >
          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="이름 또는 슬러그 검색"
            className="w-full rounded-2xl border border-neutral-200 px-4 py-2 text-sm focus:border-neutral-900 focus:outline-none md:max-w-sm"
          />
          <p className="text-sm text-neutral-500">
            총{' '}
            <span className="font-semibold text-neutral-900">
              {filteredBoards.length.toLocaleString()}
            </span>{' '}
            개의 게시판
          </p>
        </form>

        {loading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner label="게시판을 불러오는 중입니다..." />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-3xl border border-neutral-100">
            <table className="min-w-full divide-y divide-neutral-100 text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3 text-left">이름</th>
                  <th className="px-4 py-3 text-left">슬러그</th>
                  <th className="px-4 py-3 text-left">레이아웃</th>
                  <th className="px-4 py-3 text-left">순서</th>
                  <th className="px-4 py-3 text-left">상위</th>
                  <th className="px-4 py-3 text-left">표시</th>
                  <th className="px-4 py-3 text-left">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white/80">
                {filteredBoards.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-semibold text-neutral-900">{item.name}</td>
                    <td className="px-4 py-3 text-neutral-600">/{item.slug}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {getLayoutLabel(item.layoutType)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{item.orderIndex}</td>
                    <td className="px-4 py-3 text-neutral-600">{item.parentName ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          item.isVisible
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-neutral-100 text-neutral-500'
                        }`}
                      >
                        {item.isVisible ? '표시' : '숨김'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-700 hover:border-neutral-900 hover:text-neutral-900"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 hover:border-red-400 hover:text-red-700"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBoards.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-neutral-500">
                      조건에 맞는 게시판이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}






