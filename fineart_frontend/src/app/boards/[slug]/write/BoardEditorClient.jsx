'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import useDecodedAuth from '@/hooks/useDecodedAuth';
import { createArticle, updateArticle, uploadArticleImage } from '@/lib/api';
import RichTextEditor from '@/components/RichTextEditor';
import { notifyBoardsUpdated } from '@/lib/boardEvents';

const ARTICLE_CATEGORY_OPTIONS = [
  { value: 'general', label: '일반' },
  { value: 'notice', label: '공지' },
];

const defaultForm = {
  title: '',
  writer: '',
  email: '',
  content: '',
  category: 'general',
  isPinned: false,
};

const resolveUploadUrl = (payload) =>
  payload?.url ?? payload?.data?.url ?? payload?.Location ?? payload?.path ?? '';

export default function BoardEditorClient({ board, initialArticle }) {
  const router = useRouter();
  const { isAuthenticated, decodedEmail, decodedRole } = useDecodedAuth();
  const isAdmin = decodedRole === 'admin';

  const [form, setForm] = useState({
    title: initialArticle?.title ?? defaultForm.title,
    writer: initialArticle?.writer ?? defaultForm.writer,
    email: initialArticle?.email ?? decodedEmail ?? defaultForm.email,
    content: initialArticle?.content ?? defaultForm.content,
    category: initialArticle?.category?.toLowerCase?.() ?? defaultForm.category,
    isPinned: initialArticle?.isPinned ?? defaultForm.isPinned,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isEditing = Boolean(initialArticle?.id);
  const editorReadOnly = board?.isFallback;

  useEffect(() => {
    if (!initialArticle?.writer && decodedEmail) {
      setForm((prev) => ({
        ...prev,
        writer: prev.writer || decodedEmail.split('@')[0],
        email: prev.email || decodedEmail,
      }));
    }
  }, [decodedEmail, initialArticle?.writer]);

  const handleEditorImageUpload = async (file) => {
    const result = await uploadArticleImage(file);
    return resolveUploadUrl(result);
  };

  if (!isAuthenticated) {
    return (
      <div className="screen-padding section mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-semibold text-neutral-900">로그인이 필요합니다.</p>
        <p className="text-sm text-neutral-600">FineArt 계정으로 로그인하면 글을 작성할 수 있습니다.</p>
        <div className="flex gap-3">
          <Link href={`/boards/${board?.slug ?? ''}`} className="rounded-full border border-neutral-300 px-5 py-2 text-sm text-neutral-600">
            게시판으로
          </Link>
          <Link href="/login" className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white">
            로그인
          </Link>
        </div>

        {isAdmin && (
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
            <input
              type="checkbox"
              checked={form.isPinned}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, isPinned: event.target.checked }))
              }
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
            />
            공지글로 상단에 고정
          </label>
        )}
      </div>
    );
  }

  if (editorReadOnly) {
    return (
      <div className="screen-padding section mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-semibold text-neutral-900">게시판 정보를 불러오는 중입니다.</p>
        <p className="text-sm text-neutral-600">
          현재 게시판 메타데이터를 확인할 수 없어 글쓰기를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.
        </p>
        <Link href={`/boards/${board?.slug ?? ''}`} className="rounded-full border border-neutral-300 px-5 py-2 text-sm text-neutral-600">
          게시판으로 돌아가기
        </Link>
      </div>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError('제목과 본문을 입력해 주세요.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        boardId: board.id,
        title: form.title.trim(),
        content: form.content,
        writer: form.writer.trim() || 'FineArt 사용자',
        author: form.email.trim() || decodedEmail || 'user@fineart.local',
        category: form.category,
        thumbnailUrl: null,
        isPinned: form.isPinned ?? false,
      };

      if (isEditing) {
        await updateArticle(initialArticle.id, payload);
        setSuccess('게시글이 수정되었습니다.');
      } else {
        await createArticle(payload);
        setSuccess('게시글이 등록되었습니다.');
      }
      notifyBoardsUpdated();
      router.push(`/boards/${board.slug}`);
    } catch (err) {
      console.error('[Board] Failed to submit article:', err);
      setError(err?.response?.data?.message ?? '게시글 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--board-bg)]">
      <div className="screen-padding mx-auto w-full max-w-3xl py-8">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border p-6 shadow-sm bg-[var(--board-bg)] sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--board-border)' }}>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] font-medium" style={{ color: 'var(--board-text-secondary)' }}>
              {board.slug}
            </p>
            <h1 className="text-2xl font-semibold sm:text-3xl" style={{ color: 'var(--board-text)' }}>
              {isEditing ? '게시글 수정' : '새 게시글 작성'}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--board-text-secondary)' }}>{board.name}</p>
          </div>
          <Link
            href={`/boards/${board.slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm transition hover:border-neutral-900 hover:text-neutral-900"
          >
            <FiArrowLeft /> 게시판으로
          </Link>
        </div>

        {error && (
          <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
        )}
        {success && (
          <p className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{success}</p>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-3xl border p-6 shadow-sm bg-[var(--board-bg)]"
          style={{ borderColor: 'var(--board-border)' }}
        >
          <section className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--board-text-secondary)' }}>
              기본 정보
            </p>
            <label className="block text-sm font-medium" style={{ color: 'var(--board-text)' }}>
              제목
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-2.5 focus:border-neutral-900 focus:outline-none"
                placeholder="게시글 제목을 입력하세요."
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--board-text)' }}>
                작성자
                <input
                  type="text"
                  value={form.writer}
                  onChange={(event) => setForm((prev) => ({ ...prev, writer: event.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-2.5 focus:border-neutral-900 focus:outline-none"
                  placeholder="닉네임 또는 이름"
                />
              </label>

              {isAdmin && (
                <label className="block text-sm font-medium" style={{ color: 'var(--board-text)' }}>
                  게시글 구분
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, category: event.target.value }))
                    }
                    className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-2.5 focus:border-neutral-900 focus:outline-none"
                  >
                    {ARTICLE_CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--board-text-secondary)' }}>
              본문
            </p>
          <RichTextEditor
            value={form.content}
            onChange={(content) => setForm((prev) => ({ ...prev, content }))}
            readOnly={editorReadOnly}
            placeholder="내용을 입력해 주세요. 이미지를 넣으면 갤러리형 게시판에서 목록 썸네일로 사용됩니다."
            onUploadImage={handleEditorImageUpload}
          />
            <p className="text-xs" style={{ color: 'var(--board-text-secondary)' }}>
              이미지, 링크, 서식을 자유롭게 사용하세요. 본문에 넣은 첫 번째 이미지가 갤러리형 목록에 썸네일로 표시됩니다.
            </p>
          </section>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-6" style={{ borderColor: 'var(--board-border)' }}>
            <Link
              href={`/boards/${board.slug}`}
              className="rounded-full border border-neutral-200 px-4 py-2 text-sm transition hover:border-neutral-900 hover:text-neutral-900"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
            >
              {saving ? '저장 중...' : isEditing ? '수정 저장' : '게시글 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
