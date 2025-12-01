'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
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
  thumbnailUrl: '',
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
    thumbnailUrl: initialArticle?.thumbnailUrl ?? defaultForm.thumbnailUrl,
    category: initialArticle?.category?.toLowerCase?.() ?? defaultForm.category,
    isPinned: initialArticle?.isPinned ?? defaultForm.isPinned,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingField, setUploadingField] = useState(null);

  const thumbInputRef = useRef(null);

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

  const uploadAndSetField = async (file, field) => {
    if (!file) return;
    setUploadingField(field);
    setError('');
    try {
      const result = await uploadArticleImage(file);
      const url = resolveUploadUrl(result);
      if (url) {
        setForm((prev) => ({ ...prev, [field]: url }));
        setSuccess(field === 'thumbnailUrl' ? '썸네일이 업로드되었습니다.' : '대표 이미지가 업로드되었습니다.');
      }
    } catch (err) {
      console.error('[Board] Failed to upload image:', err);
      setError('이미지 업로드에 실패했습니다.');
    } finally {
      setUploadingField(null);
    }
  };

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
        boardTypeId: board.id,
        title: form.title.trim(),
        content: form.content,
        writer: form.writer.trim() || 'FineArt 사용자',
        email: form.email.trim() || decodedEmail || 'user@fineart.local',
        thumbnailUrl: form.thumbnailUrl || undefined,
        // 카테고리는 사용자가 선택한 값을 그대로 보냅니다. (공지 선택이 일반으로 내려가는 이슈 수정)
        category: form.category,
        // 공지(상단 고정)는 isPinned/isBoard 플래그로도 함께 관리합니다.
        isPinned: isAdmin ? form.isPinned : form.category === 'notice',
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
    <div className="screen-padding section mx-auto w-full max-w-4xl space-y-6 py-10">
      <div className="flex flex-col gap-3 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">{board.slug}</p>
          <h1 className="text-3xl font-semibold text-neutral-900">
            {isEditing ? '게시글 수정' : '새 게시글 작성'}
          </h1>
          <p className="text-sm text-neutral-600">{board.name}</p>
        </div>
        <Link
          href={`/boards/${board.slug}`}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-sm text-neutral-600 hover:border-neutral-900 hover:text-neutral-900"
        >
          <FiArrowLeft /> 게시판으로
        </Link>
      </div>

      {error && (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p>
      )}
      {success && (
        <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs text-emerald-700">{success}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-neutral-200 bg-white/90 p-6 shadow-sm">
        <label className="block text-sm font-medium text-neutral-700">
          제목
          <input
            type="text"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2 focus:border-neutral-900 focus:outline-none"
            placeholder="게시글 제목을 입력하세요."
          />
        </label>

        <div className="grid gap-4 md:grid-cols-1">
          <label className="text-sm font-medium text-neutral-700">
            작성자
            <input
              type="text"
              value={form.writer}
              onChange={(event) => setForm((prev) => ({ ...prev, writer: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2 focus:border-neutral-900 focus:outline-none"
              placeholder="닉네임 또는 이름"
            />
          </label>
        </div>

        {isAdmin && (
          <label className="text-sm font-medium text-neutral-700">
            게시글 구분
            <select
              value={form.category}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, category: event.target.value }))
              }
              className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2 focus:border-neutral-900 focus:outline-none"
            >
              {ARTICLE_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="grid gap-4 md:grid-cols-1">
          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-700">썸네일 이미지</p>
            {form.thumbnailUrl ? (
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
                <img
                  src={form.thumbnailUrl}
                  alt="썸네일"
                  className="h-48 w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-neutral-200 text-sm text-neutral-500">
                썸네일이 없습니다.
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  uploadAndSetField(file, 'thumbnailUrl');
                }}
              />
              <button
                type="button"
                onClick={() => thumbInputRef.current?.click()}
                disabled={uploadingField === 'thumbnailUrl'}
                className="rounded-full border border-neutral-300 px-4 py-2 text-sm text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-50"
              >
                {uploadingField === 'thumbnailUrl' ? '업로드 중...' : '썸네일 선택'}
              </button>
              {form.thumbnailUrl && (
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, thumbnailUrl: '' }))}
                  className="rounded-full border border-neutral-300 px-4 py-2 text-sm text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900"
                >
                  제거
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">본문</label>
          <RichTextEditor
            value={form.content}
            onChange={(content) => setForm((prev) => ({ ...prev, content }))}
            readOnly={editorReadOnly}
            placeholder="내용을 입력해 주세요."
            onUploadImage={handleEditorImageUpload}
          />
          <p className="text-xs text-neutral-500">
            이미지, 링크, 서식을 자유롭게 사용하세요. 저장 시 HTML 형태로 백엔드에 전달됩니다.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/boards/${board.slug}`}
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm text-neutral-600"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-neutral-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {saving ? '저장 중...' : isEditing ? '게시글 수정' : '게시글 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
