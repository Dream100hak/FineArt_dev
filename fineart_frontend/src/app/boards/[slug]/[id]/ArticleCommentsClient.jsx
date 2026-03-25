'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useDecodedAuth from '@/hooks/useDecodedAuth';
import { formatBoardPostDate } from '@/lib/date';
import { formatWriterWithIp } from '@/lib/guestIdentity';
import {
  createComment,
  createGuestComment,
  deleteComment,
  deleteGuestComment,
  getArticleComments,
  getArticleRepliesTotal,
  updateComment,
  updateGuestComment,
} from '@/lib/api';

const GUEST_AUTHOR = 'guest@fineart.local';

const normalizeComment = (comment) => {
  if (!comment) return null;
  const guestIp = comment.guestIp ?? comment.guest_ip ?? '';
  const writer = comment.writer ?? comment.author ?? '익명';
  const isGuest = comment.author === GUEST_AUTHOR || Boolean(guestIp);

  return {
    ...comment,
    guestIp,
    writer: writer ?? '익명',
    isGuest,
    writerDisplay: isGuest ? formatWriterWithIp(writer, guestIp) : writer,
    content: comment.content ?? '',
  };
};

export default function ArticleCommentsClient({ articleId, initialData }) {
  const { isAuthenticated, decodedEmail, decodedRole } = useDecodedAuth();
  const isAdmin = decodedRole === 'admin';

  const normalizedInitial = useMemo(
    () => (initialData?.items ?? []).map((c) => normalizeComment(c)).filter(Boolean),
    [initialData?.items],
  );

  const [comments, setComments] = useState(normalizedInitial);
  const [meta, setMeta] = useState({
    page: initialData?.page ?? 1,
    size: initialData?.size ?? 20,
    total: initialData?.total ?? normalizedInitial.length ?? 0,
  });

  const [repliesTotal, setRepliesTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const total = await getArticleRepliesTotal(articleId);
        if (!cancelled) setRepliesTotal(total ?? 0);
      } catch (err) {
        console.error('[Board] Failed to load replies total:', err);
        if (!cancelled) setRepliesTotal(0);
      }
    };

    if (articleId) run();
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  const [content, setContent] = useState('');
  const [guestWriter, setGuestWriter] = useState('');
  const [guestPassword, setGuestPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingGuestPassword, setEditingGuestPassword] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false);

  // Reply (답글) composer state (1단계: 특정 댓글의 하위 답글)
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyGuestWriter, setReplyGuestWriter] = useState('');
  const [replyGuestPassword, setReplyGuestPassword] = useState('');
  const [replyError, setReplyError] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [repliesByParentId, setRepliesByParentId] = useState({});
  const [repliesLoadingByParentId, setRepliesLoadingByParentId] = useState({});

  const canManageComment = useCallback(
    (comment) => {
      if (!comment) return false;
      if (isAdmin) return true;
      if (!isAuthenticated) return comment.isGuest;
      return comment.author === decodedEmail;
    },
    [decodedEmail, isAdmin, isAuthenticated],
  );

  const fetchMore = useCallback(async () => {
    if (!articleId) return;
    if (loadingMore) return;
    const nextPage = meta.page + 1;
    const totalPages = Math.max(1, Math.ceil(meta.total / (meta.size || 20)));
    if (nextPage > totalPages) return;

    try {
      setLoadingMore(true);
      setError('');
      const payload = await getArticleComments(articleId, { page: nextPage, size: meta.size });
      const nextItems = (payload?.items ?? []).map((c) => normalizeComment(c)).filter(Boolean);

      setComments((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        const merged = [...prev];
        nextItems.forEach((c) => {
          if (!seen.has(c.id)) merged.push(c);
        });
        return merged;
      });

      setMeta((prev) => ({
        ...prev,
        page: payload?.page ?? nextPage,
        total: payload?.total ?? prev.total,
      }));
    } catch (err) {
      console.error('[Board] Failed to load comments:', err);
      setError('댓글을 불러오지 못했습니다.');
    } finally {
      setLoadingMore(false);
    }
  }, [articleId, loadingMore, meta.page, meta.size, meta.total]);

  const fetchReplies = useCallback(
    async (parentCommentId) => {
      if (!parentCommentId) return;
      if (repliesLoadingByParentId[parentCommentId]) return;

      try {
        setRepliesLoadingByParentId((prev) => ({ ...prev, [parentCommentId]: true }));
        setReplyError('');

        const payload = await getArticleComments(articleId, {
          page: 1,
          size: 100,
          parentCommentId,
        });

        setRepliesByParentId((prev) => ({
          ...prev,
          [parentCommentId]: (payload?.items ?? []).map((c) => normalizeComment(c)).filter(Boolean),
        }));
      } catch (err) {
        console.error('[Board] Failed to load replies:', err);
        setReplyError('답글을 불러오지 못했습니다.');
        // 실패하더라도 "아직 로딩중"처럼 계속 표시되지 않게 빈 배열로 캐시
        setRepliesByParentId((prev) => ({
          ...prev,
          [parentCommentId]: [],
        }));
      } finally {
        setRepliesLoadingByParentId((prev) => ({ ...prev, [parentCommentId]: false }));
      }
    },
    [articleId, repliesLoadingByParentId],
  );

  // 목록에 보이는 상위 댓글들에 대한 답글을 미리 로딩(답글은 항상 펼쳐서 보여야 함)
  const commentsIds = useMemo(
    () => comments.map((c) => c?.id).filter(Boolean),
    [comments],
  );
  const commentsIdsKey = useMemo(() => commentsIds.join('|'), [commentsIds]);
  useEffect(() => {
    if (!articleId) return;
    commentsIds.forEach((id) => {
      if (!Object.prototype.hasOwnProperty.call(repliesByParentId, id)) {
        fetchReplies(id);
      }
    });
  }, [articleId, commentsIdsKey, commentsIds, fetchReplies, repliesByParentId]);

  const handleStartReply = useCallback(
    async (comment) => {
      if (!comment?.id) return;
      const targetId = comment.id;

      // 토글: 같은 댓글을 다시 누르면 닫기
      setReplyError('');
      if (replyingToId === targetId) {
        setReplyingToId(null);
        setReplyContent('');
        setReplyGuestWriter('');
        setReplyGuestPassword('');
        return;
      }

      setReplyingToId(targetId);
      setReplyContent('');
      setReplyGuestWriter('');
      setReplyGuestPassword('');
      // 답글 목록이 캐시에 없으면 먼저 로딩
      if (!repliesByParentId[targetId]) {
        await fetchReplies(targetId);
      }
    },
    [fetchReplies, replyingToId, repliesByParentId],
  );

  const handleCancelReply = useCallback(() => {
    setReplyingToId(null);
    setReplyContent('');
    setReplyGuestWriter('');
    setReplyGuestPassword('');
    setReplyError('');
  }, []);

  const handleSubmitReply = useCallback(
    async (event) => {
      event.preventDefault();
      if (!articleId || !replyingToId) return;

      const trimmedContent = replyContent.trim();
      if (!trimmedContent) {
        setReplyError('답글 내용을 입력해 주세요.');
        return;
      }

      try {
        setReplySubmitting(true);
        setReplyError('');

        if (isAuthenticated) {
          const writer = (decodedEmail ?? '').split('@')[0] || '익명';
          const payload = {
            articleId,
            parentCommentId: replyingToId,
            content: trimmedContent,
            writer,
            author: decodedEmail,
            email: null,
          };

          const created = await createComment(payload);
          const normalized = normalizeComment(created);

          if (normalized) {
            setRepliesByParentId((prev) => ({
              ...prev,
              [replyingToId]: [normalized, ...(prev[replyingToId] ?? [])],
            }));
          }
        } else {
          const password = replyGuestPassword.trim();
          if (password.length < 4) {
            setReplyError('비회원 비밀번호는 4자 이상 입력해 주세요.');
            return;
          }

          const payload = {
            articleId,
            parentCommentId: replyingToId,
            content: trimmedContent,
            writer: replyGuestWriter.trim() || '익명',
            email: null,
            password,
          };

          const created = await createGuestComment(payload);
          const normalized = normalizeComment(created);

          if (normalized) {
            setRepliesByParentId((prev) => ({
              ...prev,
              [replyingToId]: [normalized, ...(prev[replyingToId] ?? [])],
            }));
          }

          setReplyGuestPassword('');
        }

        setReplyContent('');
      } catch (err) {
        console.error('[Board] Failed to submit reply:', err);
        setReplyError(err?.response?.data?.message ?? '답글 등록에 실패했습니다.');
      } finally {
        setReplySubmitting(false);
      }
    },
    [
      articleId,
      createComment,
      createGuestComment,
      decodedEmail,
      isAuthenticated,
      replyContent,
      replyGuestPassword,
      replyGuestWriter,
      replyingToId,
    ],
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!articleId) return;

      const trimmedContent = content.trim();
      if (!trimmedContent) {
        setError('댓글 내용을 입력해 주세요.');
        return;
      }

      try {
        setSubmitting(true);
        setError('');

        if (isAuthenticated) {
          const writer = (decodedEmail ?? '').split('@')[0] || '익명';
          const payload = {
            articleId,
            content: trimmedContent,
            writer,
            author: decodedEmail,
            email: null,
          };

          const created = await createComment(payload);
          const normalized = normalizeComment(created);
          setComments((prev) => [normalized, ...prev].filter(Boolean));
          setMeta((prev) => ({
            ...prev,
            total: (prev.total ?? 0) + 1,
          }));
        } else {
          const password = guestPassword.trim();
          if (password.length < 4) {
            setError('비회원 비밀번호는 4자 이상 입력해 주세요.');
            return;
          }

          const payload = {
            articleId,
            content: trimmedContent,
            writer: guestWriter.trim() || '익명',
            email: null,
            password,
          };

          const created = await createGuestComment(payload);
          const normalized = normalizeComment(created);
          setComments((prev) => [normalized, ...prev].filter(Boolean));
          setMeta((prev) => ({
            ...prev,
            total: (prev.total ?? 0) + 1,
          }));
          setGuestPassword('');
        }

        setContent('');
        setGuestWriter('');
      } catch (err) {
        console.error('[Board] Failed to submit comment:', err);
        setError(err?.response?.data?.message ?? '댓글 등록에 실패했습니다.');
      } finally {
        setSubmitting(false);
      }
    },
    [articleId, content, decodedEmail, guestPassword, guestWriter, isAuthenticated],
  );

  const handleStartEdit = useCallback(
    (comment) => {
      if (!comment) return;
      if (!canManageComment(comment)) return;

      if (isAuthenticated && !comment.isGuest) {
        setEditingId(comment.id);
        setEditingContent(comment.content ?? '');
        setEditingGuestPassword('');
        return;
      }

      const password = window.prompt('댓글 수정 비밀번호를 입력해 주세요.');
      if (!password?.trim()) return;
      setEditingId(comment.id);
      setEditingContent(comment.content ?? '');
      setEditingGuestPassword(password.trim());
    },
    [canManageComment, isAuthenticated],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingContent('');
    setEditingGuestPassword('');
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId) return;
    const trimmedContent = editingContent.trim();
    if (!trimmedContent) {
      setError('댓글 내용을 입력해 주세요.');
      return;
    }

    try {
      setSavingEdit(true);
      setError('');

      if (isAuthenticated) {
        const updated = await updateComment(editingId, { content: trimmedContent });
        const normalized = normalizeComment(updated);
        setComments((prev) => prev.map((c) => (c.id === editingId ? normalized : c)));
      } else {
        const payload = {
          content: trimmedContent,
          writer: (comments.find((c) => c.id === editingId)?.writer ?? '익명').trim() || '익명',
          email: null,
          password: editingGuestPassword,
        };
        const updated = await updateGuestComment(editingId, payload);
        const normalized = normalizeComment(updated);
        setComments((prev) => prev.map((c) => (c.id === editingId ? normalized : c)));
      }

      handleCancelEdit();
    } catch (err) {
      console.error('[Board] Failed to save edit:', err);
      setError(err?.response?.data?.message ?? '댓글 수정에 실패했습니다.');
    } finally {
      setSavingEdit(false);
    }
  }, [
    comments,
    editingContent,
    editingGuestPassword,
    editingId,
    handleCancelEdit,
    isAuthenticated,
  ]);

  const handleDelete = useCallback(
    async (comment) => {
      if (!comment) return;
      if (!canManageComment(comment)) return;

      const confirmMessage = isAuthenticated
        ? '댓글을 삭제하시겠습니까?'
        : '댓글을 삭제하려면 비밀번호를 입력해 주세요.';

      if (isAuthenticated) {
        const confirmed = window.confirm(confirmMessage);
        if (!confirmed) return;
      }

      try {
        setError('');
        const isReply = Boolean(comment.parentCommentId);
        const parentId = comment.parentCommentId;

        if (isAuthenticated) {
          await deleteComment(comment.id);
          if (isReply) {
            setRepliesByParentId((prev) => ({
              ...prev,
              [parentId]: (prev[parentId] ?? []).filter((c) => c.id !== comment.id),
            }));
            setRepliesTotal((prev) => Math.max(0, (prev ?? 0) - 1));
          } else {
            setComments((prev) => prev.filter((c) => c.id !== comment.id));
            setMeta((prev) => ({
              ...prev,
              total: Math.max(0, (prev.total ?? 0) - 1),
            }));
          }
        } else {
          const password = window.prompt(confirmMessage);
          if (!password?.trim()) return;
          await deleteGuestComment(comment.id, password.trim());
          if (isReply) {
            setRepliesByParentId((prev) => ({
              ...prev,
              [parentId]: (prev[parentId] ?? []).filter((c) => c.id !== comment.id),
            }));
            setRepliesTotal((prev) => Math.max(0, (prev ?? 0) - 1));
          } else {
            setComments((prev) => prev.filter((c) => c.id !== comment.id));
            setMeta((prev) => ({
              ...prev,
              total: Math.max(0, (prev.total ?? 0) - 1),
            }));
          }
        }
      } catch (err) {
        console.error('[Board] Failed to delete comment:', err);
        setError(err?.response?.data?.message ?? '댓글 삭제에 실패했습니다.');
      }
    },
    [canManageComment, isAuthenticated],
  );

  const hasMore = comments.length < (meta.total ?? 0);

  const renderCommentCard = (comment, { allowReply = true, showReplyMarker = false } = {}) => {
    const isEditing = editingId === comment.id;
    const canEdit = canManageComment(comment);
    const showActions = !isEditing && canEdit;

    return (
      <div
        className={`border-t border-b bg-[var(--board-bg)] relative`}
        style={{ borderColor: 'var(--board-border)' }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between gap-3 bg-neutral-200 -mx-4 px-4 py-2">
            <div
              className={`flex min-w-0 flex-1 items-center gap-3 text-sm ${!isEditing ? 'cursor-pointer' : ''}`}
              style={{ color: 'var(--board-text-secondary)' }}
              onClick={() => {
                if (!isEditing) handleStartReply(comment);
              }}
              role="button"
              tabIndex={0}
            >
              {showReplyMarker && (
                <span className="text-neutral-400 font-bold">ㄴ</span>
              )}
              <span className="min-w-0 truncate">
                {comment.writerDisplay ?? comment.writer ?? '익명'}
              </span>
              <span className="ml-auto flex items-center gap-2">
                <span aria-hidden className="text-neutral-300">|</span>
                <span>{formatBoardPostDate(comment.createdAt)}</span>
              </span>
            </div>

            {!isEditing && (
              <div className="flex items-center gap-2 text-sm">
                {allowReply && (
                  <button
                    type="button"
                    onClick={() => handleStartReply(comment)}
                    className="rounded-full border border-neutral-200 px-4 py-1.5 font-semibold text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
                  >
                    답글
                  </button>
                )}
                {showActions && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDelete(comment)}
                      aria-label={showReplyMarker ? '답글 삭제' : '댓글 삭제'}
                      className="rounded-full border border-neutral-200 p-1.5 text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M6 6l8 8" />
                        <path d="M14 6l-8 8" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="mt-3 space-y-3">
              <textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                className="w-full resize-none rounded-xl border border-neutral-200 px-4 py-2.5 focus:border-neutral-900 focus:outline-none"
                rows={4}
              />
              {error && (
                <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              <div
                className="flex flex-wrap items-center justify-end gap-2 border-t pt-3"
                style={{ borderColor: 'var(--board-border)' }}
              >
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={savingEdit}
                  className="rounded-full border border-neutral-200 px-4 py-1.5 font-semibold text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="rounded-full bg-neutral-900 px-4 py-1.5 font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
                >
                  {savingEdit ? '저장 중...' : '수정 완료'}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 whitespace-pre-wrap break-words text-sm" style={{ color: 'var(--board-text)' }}>
              {comment.content}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--board-text)' }}>
          댓글
        </h2>
        <div className="text-sm" style={{ color: 'var(--board-text-secondary)' }}>
          {(() => {
            const topTotal = meta.total?.toLocaleString?.() ?? meta.total ?? 0;
            const combinedTotal = (meta.total ?? 0) + (repliesTotal ?? 0);

            if (combinedTotal <= 0) return null;
            if (repliesTotal > 0) return `${combinedTotal.toLocaleString()}개`;
            return `${topTotal}개`;
          })()}
        </div>
      </div>

      <div className="space-y-0">
        {comments.length === 0 ? (
          <p className="rounded-2xl border border-dashed px-4 py-6 text-sm text-center" style={{ borderColor: 'var(--board-border)', color: 'var(--board-text-secondary)' }}>
            아직 댓글이 없습니다. 첫 댓글을 남겨 주세요.
          </p>
        ) : (
          comments.map((comment) => {
            const replies = repliesByParentId[comment.id] ?? [];
            const repliesLoading = repliesLoadingByParentId[comment.id];
            const repliesLoaded = Object.prototype.hasOwnProperty.call(repliesByParentId, comment.id);
            const isReplyOpen = replyingToId === comment.id;

            return (
              <div key={comment.id}>
                {renderCommentCard(comment, { allowReply: false })}

                <div className="relative pl-6 bg-neutral-50/60 py-2 pr-2">
                  {isReplyOpen && (
                    <form onSubmit={handleSubmitReply} className="pt-2">
                      {isAuthenticated ? (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium" style={{ color: 'var(--board-text)' }}>
                            답글 내용
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              className="mt-1.5 w-full resize-none rounded-xl border border-neutral-200 px-4 py-2.5 focus:border-neutral-900 focus:outline-none"
                              rows={4}
                              placeholder="답글을 작성해 주세요."
                            />
                          </label>

                          {replyError && (
                            <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
                              {replyError}
                            </p>
                          )}

                          <div className="flex justify-end pt-2">
                            <button
                              type="submit"
                              disabled={replySubmitting}
                              className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
                            >
                              {replySubmitting ? '등록 중...' : '답글 등록'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-3 md:grid-cols-[160px_1fr]">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium" style={{ color: 'var(--board-text)' }}>
                              <input
                                type="text"
                                value={replyGuestWriter}
                                onChange={(e) => setReplyGuestWriter(e.target.value)}
                                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-2.5 focus:border-neutral-900 focus:outline-none"
                                placeholder="닉네임"
                              />
                            </label>

                            <label className="block text-sm font-medium" style={{ color: 'var(--board-text)' }}>
                              <input
                                type="password"
                                value={replyGuestPassword}
                                onChange={(e) => setReplyGuestPassword(e.target.value)}
                                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-2.5 focus:border-neutral-900 focus:outline-none"
                                placeholder="비번"
                              />
                            </label>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium" style={{ color: 'var(--board-text)' }}>
                              <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                className="mt-1.5 w-full resize-none rounded-xl border border-neutral-200 px-4 py-2.5 focus:border-neutral-900 focus:outline-none"
                                rows={4}
                                placeholder="답글을 작성해 주세요."
                              />
                            </label>

                            {replyError && (
                              <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
                                {replyError}
                              </p>
                            )}

                            <div className="flex justify-end pt-2">
                              <button
                                type="submit"
                                disabled={replySubmitting}
                                className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
                              >
                                {replySubmitting ? '등록 중...' : '답글 등록'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </form>
                  )}

                  <div className="space-y-0 pt-2">
                    {(!repliesLoaded || repliesLoading) ? (
                      <p className="px-4 py-4 text-sm" style={{ color: 'var(--board-text-secondary)' }}>
                        답글을 불러오는 중입니다...
                      </p>
                    ) : (
                      replies.map((reply) => (
                        <div key={reply.id}>
                          {renderCommentCard(reply, { allowReply: false, showReplyMarker: true })}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            disabled={loadingMore}
            onClick={fetchMore}
            className="rounded-full border border-neutral-200 px-6 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-50"
          >
            {loadingMore ? '불러오는 중...' : '더 보기'}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="pt-2">
        {isAuthenticated ? (
          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: 'var(--board-text)' }}>
              댓글 내용
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-1.5 w-full resize-none rounded-xl border border-neutral-200 px-4 py-2.5 focus:border-neutral-900 focus:outline-none"
                rows={4}
                placeholder="댓글을 작성해 주세요."
              />
            </label>

            {error && (
              <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
              >
                {submitting ? '등록 중...' : '댓글 등록'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-[160px_1fr]">
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--board-text)' }}>              
                <input
                  type="text"
                  value={guestWriter}
                  onChange={(e) => setGuestWriter(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-2.5 focus:border-neutral-900 focus:outline-none"
                  placeholder="닉네임"
                />
              </label>
              <label className="block text-sm font-medium" style={{ color: 'var(--board-text)' }}>
                <input
                  type="password"
                  value={guestPassword}
                  onChange={(e) => setGuestPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-2.5 focus:border-neutral-900 focus:outline-none"
                  placeholder="비밀번호"
                />
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--board-text)' }}>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="mt-1.5 w-full resize-none rounded-xl border border-neutral-200 px-4 py-2.5 focus:border-neutral-900 focus:outline-none"
                  rows={4}
                  placeholder="댓글을 작성해 주세요."
                />
              </label>

              {error && (
                <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
                >
                  {submitting ? '등록 중...' : '댓글 등록'}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

