'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import useDecodedAuth from '@/hooks/useDecodedAuth';
import { deleteArticle } from '@/lib/api';
import { notifyBoardsUpdated } from '@/lib/boardEvents';

const normalize = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

export default function BoardDetailActions({
  boardSlug,
  articleId,
  articleEmail,
  articleWriter,
}) {
  const router = useRouter();
  const { decodedRole, decodedEmail } = useDecodedAuth();
  const [deleting, setDeleting] = useState(false);

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

  if (!boardSlug || !articleId || (!isAdmin && !isAuthor)) {
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
