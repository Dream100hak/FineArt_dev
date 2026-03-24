'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import useDecodedAuth from '@/hooks/useDecodedAuth';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  createBoard,
  createBoardTag,
  deleteBoard,
  deleteBoardTag,
  getBoardTags,
  getBoards,
  updateBoard,
  updateBoardTag,
} from '@/lib/api';
import { notifyBoardsUpdated } from '@/lib/boardEvents';

const defaultForm = {
  name: '',
  slug: '',
  description: '',
  groupName: '',
  isVisible: true,
};

const normalizeLayoutType = (value) => {
  const normalized = (value ?? 'list').toLowerCase();
  if (normalized === 'table') return 'list';
  if (normalized === 'card' || normalized === 'cards') return 'gallery'; // 레거시
  return normalized;
};

const normalizeBoards = (items = []) =>
  items.map((item, index) => ({
    id: item.id ?? index + 1,
    name: item.name ?? '이름 미정',
    slug: item.slug ?? `board-${index + 1}`,
    description: item.description ?? '',
    layoutType: normalizeLayoutType(item.layoutType),
    groupOrder: Number(item.groupOrder ?? item.group_order ?? 0),
    orderIndex: item.orderIndex ?? index,
    groupName: item.groupName ?? item.group_name ?? '',
    isVisible: item.isVisible ?? true,
    articleCount:
      item.articleCount ?? item.articlesCount ?? item.postsCount ?? item.count ?? 0,
  }));

function BoardDropZone({ id, children, className }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'border-sky-300 bg-sky-50/60' : ''}`}
    >
      {children}
    </div>
  );
}

function DraggableBoardItem({ board, id, isDragging, isOverTarget }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useDraggable({ id });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded-xl border bg-white px-3 py-2 ${
        isDragging
          ? 'border-neutral-400 opacity-70'
          : isOverTarget
            ? 'border-sky-400 ring-2 ring-sky-100'
            : 'border-neutral-200'
      }`}
      {...listeners}
      {...attributes}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-neutral-900">{board.name}</p>
        <p className="truncate text-xs text-neutral-500">/{board.slug}</p>
      </div>
      <span className="text-xs text-neutral-400">드래그</span>
    </div>
  );
}

export default function AdminBoardsClient() {
  const searchParams = useSearchParams();
  const { isAuthenticated, decodedRole } = useDecodedAuth();
  const isAdmin = decodedRole === 'admin';
  const canManage = isAuthenticated && isAdmin;

  const [boards, setBoards] = useState([]);
  const [tags, setTags] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [groupSaving, setGroupSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [keyword, setKeyword] = useState('');
  const [pendingPrefillSlug, setPendingPrefillSlug] = useState('');
  const [consumedPrefillSlug, setConsumedPrefillSlug] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [draggedTagId, setDraggedTagId] = useState(null);
  const [draggedBoardId, setDraggedBoardId] = useState(null);
  const [dragOverTagName, setDragOverTagName] = useState('');
  const [dragOverBoardId, setDragOverBoardId] = useState('');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const tagOrderMap = useMemo(
    () => new Map((tags ?? []).map((tag) => [tag.name, Number(tag.orderIndex ?? 0)])),
    [tags],
  );

  const filteredBoards = useMemo(() => {
    if (!keyword.trim()) return boards;
    const term = keyword.trim().toLowerCase();
    return boards
      .filter(
        (board) =>
          board.name.toLowerCase().includes(term) ||
          board.slug.toLowerCase().includes(term) ||
          board.description.toLowerCase().includes(term) ||
          (board.groupName ?? '').toLowerCase().includes(term),
      )
      .sort((a, b) => {
        const groupOrderCompare =
          (tagOrderMap.get(a.groupName ?? '기타') ?? a.groupOrder ?? 0) -
          (tagOrderMap.get(b.groupName ?? '기타') ?? b.groupOrder ?? 0);
        if (groupOrderCompare !== 0) return groupOrderCompare;
        const groupCompare = (a.groupName ?? '기타').localeCompare(b.groupName ?? '기타', 'ko-KR');
        if (groupCompare !== 0) return groupCompare;
        const orderCompare = (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
        if (orderCompare !== 0) return orderCompare;
        return a.name.localeCompare(b.name, 'ko-KR');
      });
  }, [boards, keyword, tagOrderMap]);

  const groupedTags = useMemo(() => {
    const countMap = new Map();
    boards.forEach((board) => {
      const name = (board.groupName ?? '').trim() || '기타';
      countMap.set(name, (countMap.get(name) ?? 0) + 1);
    });
    return [...tags]
      .sort((a, b) => {
        const orderDiff = Number(a.orderIndex ?? 0) - Number(b.orderIndex ?? 0);
        if (orderDiff !== 0) return orderDiff;
        return (a.name ?? '').localeCompare(b.name ?? '', 'ko-KR');
      })
      .map((tag) => ({
        ...tag,
        count: countMap.get(tag.name) ?? 0,
      }));
  }, [boards, tags]);

  const tagOptions = useMemo(() => {
    const set = new Set();
    tags.forEach((tag) => {
      const name = (tag.name ?? '').trim();
      if (name) set.add(name);
    });
    boards.forEach((board) => {
      const name = (board.groupName ?? '').trim();
      if (name) set.add(name);
    });
    if (!set.has('기타')) set.add('기타');
    return Array.from(set).sort((a, b) => {
      const aOrder = tagOrderMap.get(a) ?? 9999;
      const bOrder = tagOrderMap.get(b) ?? 9999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.localeCompare(b, 'ko-KR');
    });
  }, [boards, tags, tagOrderMap]);

  const boardsByTag = useMemo(() => {
    const map = new Map();
    tagOptions.forEach((tagName) => map.set(tagName, []));
    boards.forEach((board) => {
      const tagName = (board.groupName ?? '').trim() || '기타';
      if (!map.has(tagName)) map.set(tagName, []);
      map.get(tagName).push(board);
    });
    return Array.from(map.entries()).map(([tagName, items]) => ({
      tagName,
      items: [...items].sort((a, b) => {
        const orderCompare = Number(a.orderIndex ?? 0) - Number(b.orderIndex ?? 0);
        if (orderCompare !== 0) return orderCompare;
        return (a.name ?? '').localeCompare(b.name ?? '', 'ko-KR');
      }),
    }));
  }, [boards, tagOptions]);

  const draggedBoard = useMemo(
    () => boards.find((board) => board.id === draggedBoardId) ?? null,
    [boards, draggedBoardId],
  );

  const boardById = useMemo(() => {
    const map = new Map();
    boards.forEach((board) => map.set(String(board.id), board));
    return map;
  }, [boards]);

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
      setBoards(normalizeBoards(payload?.items ?? []));
    } catch (err) {
      console.error('[Admin Boards] fetch failed', err);
      setError('게시판 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  const fetchTags = useCallback(async () => {
    if (!canManage) return;
    try {
      const payload = await getBoardTags();
      setTags(payload ?? []);
    } catch (err) {
      console.error('[Admin Boards] fetch tags failed', err);
      setError('태그 목록을 불러오지 못했습니다.');
    }
  }, [canManage]);

  useEffect(() => {
    fetchBoards();
    fetchTags();
  }, [fetchBoards, fetchTags]);

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
      const normalizedGroupName = form.groupName?.trim() || null;

      if (
        normalizedGroupName &&
        !tags.some((tag) => (tag.name ?? '').toLowerCase() === normalizedGroupName.toLowerCase())
      ) {
        await createBoardTag({
          name: normalizedGroupName,
          orderIndex: (tags.length + 1) * 10,
        });
      }

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || undefined,
        layoutType: 'list',
        groupName: normalizedGroupName,
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
      setIsFormOpen(false);
      await fetchBoards();
      await fetchTags();
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
    setIsFormOpen(true);
    setForm({
      name: board.name ?? '',
      slug: board.slug ?? '',
      description: board.description ?? '',
      groupName: board.groupName ?? '',
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

  const applyGroupOrders = async (nextTags) => {
    setGroupSaving(true);
    setError('');
    setSuccess('');
    try {
      await Promise.all(
        nextTags.map((tag, idx) => {
          const nextOrder = (idx + 1) * 10;
          if (Number(tag.orderIndex ?? 0) === nextOrder) return Promise.resolve();
          return updateBoardTag(tag.id, { orderIndex: nextOrder });
        }),
      );
      setTags(nextTags.map((tag, idx) => ({ ...tag, orderIndex: (idx + 1) * 10 })));
      await fetchBoards();
      await fetchTags();
      notifyBoardsUpdated();
      setSuccess('태그 순서가 업데이트되었습니다.');
    } catch (err) {
      console.error('[Admin Boards] group order update failed', err);
      setError('태그 순서 업데이트에 실패했습니다.');
    } finally {
      setGroupSaving(false);
    }
  };

  const handleMoveTag = async (tagId, direction) => {
    const currentIndex = tags.findIndex((tag) => tag.id === tagId);
    if (currentIndex < 0) return;
    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= tags.length) return;
    const reordered = [...tags];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, moved);
    await applyGroupOrders(reordered);
  };

  const handleTagAdd = async () => {
    const name = newTagName.trim();
    if (!name) return;
    if (tags.some((tag) => tag.name.toLowerCase() === name.toLowerCase())) {
      setError('이미 존재하는 태그입니다.');
      return;
    }
    try {
      setGroupSaving(true);
      await createBoardTag({
        name,
        orderIndex: (tags.length + 1) * 10,
      });
      setNewTagName('');
      await fetchTags();
      setSuccess('태그가 추가되었습니다.');
    } catch (err) {
      console.error('[Admin Boards] add tag failed', err);
      setError('태그 추가에 실패했습니다.');
    } finally {
      setGroupSaving(false);
    }
  };

  const handleTagDelete = async (tag) => {
    if ((tag?.name ?? '').trim() === '기타') {
      setError('기타 태그는 삭제할 수 없습니다.');
      return;
    }
    if (!window.confirm(`"${tag.name}" 태그를 삭제할까요? 소속 게시판은 '기타'로 이동합니다.`)) {
      return;
    }
    try {
      setGroupSaving(true);
      const relatedBoards = boards.filter((board) => (board.groupName ?? '') === tag.name);
      await Promise.all(
        relatedBoards.map((board) =>
          updateBoard(board.id, { groupName: '기타' }),
        ),
      );
      await deleteBoardTag(tag.id);
      await fetchBoards();
      await fetchTags();
      notifyBoardsUpdated();
      setSuccess('태그가 삭제되었습니다.');
    } catch (err) {
      console.error('[Admin Boards] delete tag failed', err);
      setError('태그 삭제에 실패했습니다.');
    } finally {
      setGroupSaving(false);
    }
  };

  const handleBoardDropToTag = async (targetTagName, targetBoardId = null) => {
    if (!draggedBoardId) return;
    const draggedBoard = boards.find((board) => board.id === draggedBoardId);
    if (!draggedBoard) return;

    const sourceTagName = (draggedBoard.groupName ?? '').trim() || '기타';
    const resolvedTargetTag = (targetTagName ?? '').trim() || '기타';
    const sourceItems = boardsByTag.find((group) => group.tagName === sourceTagName)?.items ?? [];
    const targetItems = boardsByTag.find((group) => group.tagName === resolvedTargetTag)?.items ?? [];

    const sourceWithoutDragged = sourceItems.filter((item) => item.id !== draggedBoard.id);
    const targetBase =
      sourceTagName === resolvedTargetTag ? sourceWithoutDragged : [...targetItems];

    let insertIndex = targetBase.length;
    if (targetBoardId) {
      const index = targetBase.findIndex((item) => item.id === targetBoardId);
      if (index >= 0) insertIndex = index;
    }

    const nextTarget = [...targetBase];
    nextTarget.splice(insertIndex, 0, draggedBoard);

    const updates = [];
    sourceWithoutDragged.forEach((board, index) => {
      const nextOrderIndex = (index + 1) * 10;
      if (Number(board.orderIndex ?? 0) !== nextOrderIndex) {
        updates.push(updateBoard(board.id, { orderIndex: nextOrderIndex }));
      }
    });

    nextTarget.forEach((board, index) => {
      const nextOrderIndex = (index + 1) * 10;
      const currentGroupName =
        board.id === draggedBoard.id
          ? sourceTagName
          : ((board.groupName ?? '').trim() || '기타');
      const needsGroup = currentGroupName !== resolvedTargetTag;
      const needsOrder = Number(board.orderIndex ?? 0) !== nextOrderIndex;
      if (needsGroup || needsOrder) {
        updates.push(
          updateBoard(board.id, {
            groupName: resolvedTargetTag,
            orderIndex: nextOrderIndex,
          }),
        );
      }
    });

    try {
      setGroupSaving(true);
      setError('');
      setSuccess('');
      await Promise.all(updates);
      await fetchBoards();
      notifyBoardsUpdated();
      setSuccess('게시판 순서가 업데이트되었습니다.');
    } catch (err) {
      console.error('[Admin Boards] board reorder failed', err);
      setError('게시판 순서 변경에 실패했습니다.');
    } finally {
      setGroupSaving(false);
      setDraggedBoardId(null);
      setDragOverTagName('');
      setDragOverBoardId('');
    }
  };

  const handleBoardDragStart = (event) => {
    const activeId = String(event.active?.id ?? '');
    if (!activeId.startsWith('board:')) return;
    const boardId = activeId.replace('board:', '');
    setDraggedBoardId(boardId);
    const board = boardById.get(boardId);
    const tagName = (board?.groupName ?? '').trim() || '기타';
    setDragOverTagName(tagName);
  };

  const handleBoardDragOver = (event) => {
    const overId = String(event.over?.id ?? '');
    if (!overId) return;
    if (overId.startsWith('tag:')) {
      setDragOverTagName(overId.replace('tag:', ''));
      setDragOverBoardId('');
      return;
    }
    if (overId.startsWith('board:')) {
      const overBoardId = overId.replace('board:', '');
      setDragOverBoardId(overBoardId);
      const overBoard = boardById.get(overBoardId);
      const tagName = (overBoard?.groupName ?? '').trim() || '기타';
      setDragOverTagName(tagName);
    }
  };

  const handleBoardDragEnd = async (event) => {
    const activeId = String(event.active?.id ?? '');
    const overId = String(event.over?.id ?? '');
    if (!activeId.startsWith('board:') || !overId) {
      setDraggedBoardId(null);
      setDragOverTagName('');
      setDragOverBoardId('');
      return;
    }

    const sourceBoardId = activeId.replace('board:', '');
    setDraggedBoardId(sourceBoardId);

    let targetTagName = '';
    let targetBoardId = null;

    if (overId.startsWith('tag:')) {
      targetTagName = overId.replace('tag:', '');
    } else if (overId.startsWith('board:')) {
      targetBoardId = overId.replace('board:', '');
      const overBoard = boardById.get(targetBoardId);
      targetTagName = (overBoard?.groupName ?? '').trim() || '기타';
    }

    if (!targetTagName) {
      setDraggedBoardId(null);
      setDragOverTagName('');
      setDragOverBoardId('');
      return;
    }

    await handleBoardDropToTag(targetTagName, targetBoardId);
  };



  if (!canManage) {
    return (
      <div className="screen-padding section mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-semibold text-neutral-900">접근 권한이 필요합니다.</p>
        <p className="text-sm text-neutral-600">관리자 계정으로 로그인해 주세요.</p>
      </div>
    );
  }

  const editingBoard = editingId ? boards.find((b) => b.id === editingId) : null;

  return (
    <div className="screen-padding section mx-auto flex w-full max-w-[120rem] flex-col gap-6 py-10">
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

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-6">
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-neutral-900">게시판 목록</h2>
          <div className="flex flex-wrap items-center gap-3">
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3"
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
                className="w-full rounded-xl border border-neutral-200 px-4 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none sm:w-56"
              />
              <p className="text-sm text-neutral-500">
                총 <span className="font-semibold text-neutral-900">{filteredBoards.length.toLocaleString()}</span>개
              </p>
            </form>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(defaultForm);
                setIsFormOpen(true);
              }}
              className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              새 게시판 추가
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner label="게시판을 불러오는 중입니다..." />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-neutral-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  <th className="px-4 py-3">이름</th>
                  <th className="px-4 py-3">슬러그</th>
                  <th className="px-4 py-3">그룹</th>
                  <th className="px-4 py-3">표시</th>
                  <th className="px-4 py-3">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {filteredBoards.map((item) => {
                  const isEditing = item.id === editingId;
                  return (
                    <tr
                      key={item.id}
                      className={`transition ${
                        isEditing && isFormOpen
                          ? 'bg-amber-50/50 ring-1 ring-amber-200 ring-inset'
                          : 'hover:bg-neutral-50/80'
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-neutral-900">{item.name}</td>
                      <td className="px-4 py-3 text-neutral-600">/{item.slug}</td>
                      <td className="px-4 py-3 text-neutral-600">{item.groupName || '-'}</td>
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
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                              isEditing && isFormOpen
                                ? 'border-amber-400 bg-amber-100 text-amber-800'
                                : 'border-neutral-200 text-neutral-700 hover:border-neutral-900 hover:text-neutral-900'
                            }`}
                          >
                            {isEditing && isFormOpen ? '수정 중' : '수정'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-400 hover:bg-red-50 hover:text-red-700"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredBoards.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-neutral-500">
                      조건에 맞는 게시판이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isFormOpen && (
      <section
        className={`rounded-3xl border p-6 shadow-sm transition ${
          editingId ? 'border-amber-200 bg-amber-50/30' : 'border-neutral-200 bg-white'
        }`}
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              {editingId ? (
                <>
                  <span className="text-amber-700">게시판 수정</span>
                  {editingBoard && <span className="ml-2 text-neutral-600">· {editingBoard.name}</span>}
                </>
              ) : (
                '새 게시판 추가'
              )}
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              {editingId ? '아래에서 항목을 수정한 뒤 저장하세요.' : '필드를 입력한 뒤 "게시판 생성"을 누르세요.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm(defaultForm);
              setIsFormOpen(false);
            }}
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm transition hover:border-neutral-900 hover:text-neutral-900"
            disabled={saving}
          >
            닫기
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
              기본 정보
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-neutral-700">
                게시판 이름
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                  placeholder="예: 공지사항"
                />
              </label>
              <label className="block text-sm font-medium text-neutral-700">
                슬러그 (URL 경로)
                <input
                  value={form.slug}
                  onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                  placeholder="예: notice"
                />
              </label>
            </div>
            <label className="block text-sm font-medium text-neutral-700">
              설명
              <textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                className="mt-1.5 min-h-[100px] w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                placeholder="게시판 소개 문구"
              />
            </label>
          </section>

          <section className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
              그룹 태그
            </p>
            <div className="grid gap-6 md:grid-cols-1">
              <label className="block text-sm font-medium text-neutral-700">
                그룹 태그
                <select
                  value={form.groupName}
                  onChange={(event) => setForm((prev) => ({ ...prev, groupName: event.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                >
                  <option value="">태그 선택</option>
                  {tagOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-neutral-500">
                  새 태그가 필요하면 우측 태그 순서 관리에서 먼저 추가해 주세요.
                </p>
              </label>
            </div>
          </section>

          <section className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
              표시 설정
            </p>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3 transition hover:border-neutral-300">
              <input
                type="checkbox"
                checked={form.isVisible}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, isVisible: event.target.checked }))
                }
                className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
              />
              <span className="text-sm font-medium text-neutral-700">메뉴에 표시</span>
              <span className="text-xs text-neutral-500">체크 해제 시 목록에서 숨깁니다.</span>
            </label>
          </section>

          <div className="flex items-center justify-end gap-3 border-t border-neutral-100 pt-6">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(defaultForm);
                }}
                className="rounded-full border border-neutral-200 px-4 py-2 text-sm transition hover:border-neutral-900 hover:text-neutral-900"
                disabled={saving}
              >
                취소
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
            >
              {saving ? '저장 중...' : editingId ? '수정 저장' : '게시판 생성'}
            </button>
          </div>
        </form>
      </section>
      )}
      </div>

      <div className="space-y-6">
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">태그 순서 관리</h2>
          <p className="text-xs text-neutral-500">드래그앤드롭 또는 위/아래 버튼으로 정렬하세요.</p>
        </div>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={newTagName}
            onChange={(event) => setNewTagName(event.target.value)}
            placeholder="새 태그 이름"
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleTagAdd}
            disabled={groupSaving || !newTagName.trim()}
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm transition hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-40"
          >
            태그 추가
          </button>
        </div>

        <div className="space-y-2">
          {groupedTags.length === 0 ? (
            <p className="text-sm text-neutral-500">등록된 태그가 없습니다.</p>
          ) : (
            groupedTags.map((tag, idx) => (
              <div
                key={tag.id}
                draggable={!groupSaving}
                onDragStart={() => setDraggedTagId(tag.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={async () => {
                  if (!draggedTagId || draggedTagId === tag.id) return;
                  const from = groupedTags.findIndex((item) => item.id === draggedTagId);
                  const to = groupedTags.findIndex((item) => item.id === tag.id);
                  if (from < 0 || to < 0) return;
                  const reordered = [...groupedTags];
                  const [moved] = reordered.splice(from, 1);
                  reordered.splice(to, 0, moved);
                  setDraggedTagId(null);
                  await applyGroupOrders(reordered);
                }}
                onDragEnd={() => setDraggedTagId(null)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                  draggedTagId === tag.id ? 'border-neutral-400 bg-neutral-50' : 'border-neutral-200'
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900">{tag.name}</p>
                  <p className="text-xs text-neutral-500">게시판 {tag.count}개</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMoveTag(tag.id, 'up')}
                    disabled={groupSaving || idx === 0}
                    className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-40"
                  >
                    위로
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveTag(tag.id, 'down')}
                    disabled={groupSaving || idx === groupedTags.length - 1}
                    className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-40"
                  >
                    아래로
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTagDelete(tag)}
                    disabled={groupSaving || tag.name === '기타'}
                    className="rounded-full border border-red-200 px-3 py-1.5 text-xs text-red-600 transition hover:border-red-500 hover:text-red-700 disabled:opacity-40"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">게시판 순서 관리</h2>
          <p className="text-xs text-neutral-500">
            태그별로 게시판을 드래그해서 순서/소속 태그를 변경할 수 있습니다.
          </p>
        </div>
        {draggedBoard && (
          <p className="mb-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700">
            <span className="font-semibold">{draggedBoard.name}</span>을(를) 다른 태그 영역에 놓으면 소속 태그가 변경됩니다.
          </p>
        )}
        <DndContext
          sensors={sensors}
          onDragStart={handleBoardDragStart}
          onDragOver={handleBoardDragOver}
          onDragEnd={handleBoardDragEnd}
          onDragCancel={() => {
            setDraggedBoardId(null);
            setDragOverTagName('');
            setDragOverBoardId('');
          }}
        >
          <div className="space-y-3">
            {boardsByTag.map((group) => (
              <BoardDropZone
                key={group.tagName}
                id={`tag:${group.tagName}`}
                className={`rounded-2xl border p-3 transition ${
                  dragOverTagName === group.tagName
                    ? 'border-sky-300 bg-sky-50/60'
                    : 'border-neutral-200 bg-neutral-50/40'
                }`}
              >
                <p className="mb-2 text-sm font-semibold text-neutral-900">
                  {group.tagName}
                  <span className="ml-2 text-xs font-normal text-neutral-500">
                    {group.items.length}개
                  </span>
                </p>
                {group.items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-500">
                    이 태그에 게시판이 없습니다. 게시판을 여기로 드래그해 주세요.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {group.items.map((board) => (
                      <BoardDropZone
                        key={board.id}
                        id={`board:${board.id}`}
                        className="rounded-xl border border-transparent"
                      >
                        <DraggableBoardItem
                          board={board}
                          id={`board:${board.id}`}
                          isDragging={String(draggedBoardId) === String(board.id)}
                          isOverTarget={
                            String(draggedBoardId) !== String(board.id) &&
                            String(dragOverBoardId) === String(board.id)
                          }
                        />
                        {String(dragOverBoardId) === String(board.id) &&
                          String(draggedBoardId) !== String(board.id) && (
                            <p className="mt-1 text-[11px] font-medium text-sky-600">여기에 배치</p>
                          )}
                      </BoardDropZone>
                    ))}
                  </div>
                )}
              </BoardDropZone>
            ))}
          </div>
        </DndContext>
      </section>

      </div>
      </div>
    </div>
  );
}






