'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteArticle } from '@/lib/api';
import useDecodedAuth from '@/hooks/useDecodedAuth';

export default function ArticleAdminActions({ articleId }) {
  const router = useRouter();
  const { decodedRole } = useDecodedAuth();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  if (decodedRole !== 'admin') {
    return null;
  }

  const handleDelete = () => {
    if (!articleId) return;
    if (!window.confirm('이 게시글을 삭제하시겠습니까?')) return;

    startTransition(async () => {
      try {
        await deleteArticle(articleId);
        router.push('/articles');
      } catch (err) {
        setError(err?.response?.data?.message ?? '삭제에 실패했습니다.');
      }
    });
  };

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold">관리자 도구</span>
        <div className="flex gap-2">
          <Link
            href={`/admin/articles?articleId=${articleId}`}
            className="rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary"
          >
            수정
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-full border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-700 disabled:opacity-50"
          >
            삭제
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
