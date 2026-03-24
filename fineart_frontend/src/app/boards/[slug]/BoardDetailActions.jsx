'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import useDecodedAuth from '@/hooks/useDecodedAuth';
import { deleteArticle, deleteGuestArticle } from '@/lib/api';
import { notifyBoardsUpdated } from '@/lib/boardEvents';

const normalize = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

export default function BoardDetailActions({
  boardSlug,
  articleId,
  articleEmail,
  articleWriter,
  articleIsGuest = false,
}) {
  const router = useRouter();
  const { decodedRole, decodedEmail } = useDecodedAuth();
  const [deleting, setDeleting] = useState(false);
  const [guestDeleting, setGuestDeleting] = useState(false);

  const isAdmin = decodedRole === 'admin';
  const userEmail = normalize(decodedEmail);
  const userName = normalize(decodedEmail?.split?.('@')?.[0]);
  const normalizedWriter = normalize(articleWriter);
  const normalizedAuthorEmail = normalize(articleEmail);
  const isAuthor =
    !!userEmail &&
    (userEmail === normalizedAuthorEmail ||
      userEmail === normalizedWriter ||
      (!!userName && userName === normalizedWriter));

  const canGuestManage = !decodedEmail && articleIsGuest;

  if (!boardSlug || !articleId || (!isAdmin && !isAuthor && !canGuestManage)) {
    return null;
  }

  const handleDelete = async () => {
    if (deleting) return;
    const confirmed = window.confirm('게시글을 삭제하시겠습니까?');
    if (!confirmed) return;

    try {
      setDeleting(true);
      await deleteArticle(articleId);
      notifyBoardsUpdated();
      router.push(`/boards/${boardSlug}`);
    } catch (error) {
      console.error('[Board] Failed to delete article:', error);
      alert(error?.response?.data?.message ?? '게시글 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const handleGuestEdit = () => {
    const password = window.prompt('작성 시 설정한 비밀번호를 입력해 주세요.');
    if (!password?.trim()) return;
    window.sessionStorage.setItem(`fineart_guest_pw:${articleId}`, password.trim());
    router.push(`/boards/${boardSlug}/write?articleId=${articleId}&guest=1`);
  };

  const handleGuestDelete = async () => {
    if (guestDeleting) return;
    const password = window.prompt('삭제하려면 작성 비밀번호를 입력해 주세요.');
    if (!password?.trim()) return;
    const confirmed = window.confirm('게시글을 삭제하시겠습니까?');
    if (!confirmed) return;

    try {
      setGuestDeleting(true);
      const result = await deleteGuestArticle(articleId, password.trim());
      if (!result?.success) {
        throw new Error('비밀번호가 일치하지 않습니다.');
      }
      notifyBoardsUpdated();
      router.push(`/boards/${boardSlug}`);
    } catch (error) {
      console.error('[Board] Failed to delete guest article:', error);
      alert('비밀번호가 일치하지 않거나 삭제에 실패했습니다.');
    } finally {
      setGuestDeleting(false);
    }
  };

  if (isAdmin || isAuthor) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href={`/boards/${boardSlug}/write?articleId=${articleId}`}
          className="rounded-full border border-neutral-200 px-4 py-2 font-semibold text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
        >
          글 수정
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-full bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {deleting ? '삭제 중...' : '글 삭제'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleGuestEdit}
        className="rounded-full border border-neutral-200 px-4 py-2 font-semibold text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
      >
        글 수정
      </button>
      <button
        type="button"
        onClick={handleGuestDelete}
        disabled={guestDeleting}
        className="rounded-full bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {guestDeleting ? '삭제 중...' : '글 삭제'}
      </button>
    </div>
  );
}
