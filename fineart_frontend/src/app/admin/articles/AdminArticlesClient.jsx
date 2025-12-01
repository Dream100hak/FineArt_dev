'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createArticle,
  deleteArticle,
  getArticles,
  updateArticle,
  uploadArticleImage,
} from '@/lib/api';
import useDecodedAuth from '@/hooks/useDecodedAuth';

const CATEGORY_OPTIONS = [
  { value: 'notice', label: '공지사항' },
  { value: 'event', label: '이벤트' },
  { value: 'free', label: '자유게시판' },
];

const defaultForm = {
  title: '',
  writer: '',
  category: CATEGORY_OPTIONS[0].value,
  imageUrl: '',
  thumbnailUrl: '',
  content: '',
};

const normalizeArticle = (item) => ({
  id: item.id ?? item.Id ?? item.ID ?? null,
  title: item.title ?? '',
  content: item.content ?? '',
  writer: item.author ?? item.writer ?? '',
  category: item.category ?? 'notice',
  imageUrl: item.imageUrl ?? '',
  thumbnailUrl: item.thumbnailUrl ?? '',
  createdAt: item.createdAt ?? '',
  views: item.views ?? 0,
});

const resolveUploadUrl = (payload) =>
  payload?.url ?? payload?.data?.url ?? payload?.Location ?? payload?.path ?? '';

export default function AdminArticlesClient({ initialArticleId }) {
  const router = useRouter();
  const { isAuthenticated, decodedRole } = useDecodedAuth();
  const isAdmin = decodedRole === 'admin';
  const canManage = isAuthenticated && isAdmin;
  const [articles, setArticles] = useState([]);
  const [meta, setMeta] = useState({ page: 1, size: 10, total: 0 });
  const [filters, setFilters] = useState({ category: '', keyword: '' });
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const heroInputRef = useRef(null);
  const thumbInputRef = useRef(null);
  const contentImageRef = useRef(null);

  const fetchArticles = useCallback(
    async (pageOverride = 1) => {
      if (!canManage) return;
      setLoading(true);
      setError('');

      try {
        const response = await getArticles({
          page: pageOverride,
          size: meta.size,
          category: filters.category || undefined,
          keyword: filters.keyword || undefined,
        });

        const items = Array.isArray(response?.items) ? response.items : [];
        setArticles(items.map(normalizeArticle));
        setMeta({
          page: response?.page ?? pageOverride,
          size: response?.size ?? meta.size,
          total: response?.total ?? items.length,
        });
      } catch (err) {
        console.error('[Admin Articles] fetch failed', err);
        setError('게시글을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [canManage, filters.category, filters.keyword, meta.size],
  );

  useEffect(() => {
    if (canManage) {
      fetchArticles(1);
    }
  }, [canManage, fetchArticles]);

  useEffect(() => {
    if (!initialArticleId) return;
    const target = articles.find((item) => String(item.id) === String(initialArticleId));
    if (target) {
      setForm({
        title: target.title,
        writer: target.writer,
        category: target.category,
        imageUrl: target.imageUrl,
        thumbnailUrl: target.thumbnailUrl,
        content: target.content,
      });
      setEditingId(target.id);
    }
  }, [articles, initialArticleId]);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const handleEdit = (article) => {
    setForm({
      title: article.title,
      writer: article.writer,
      category: article.category,
      imageUrl: article.imageUrl,
      thumbnailUrl: article.thumbnailUrl,
      content: article.content,
    });
    setEditingId(article.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('해당 게시글을 삭제하시겠습니까?')) return;
    try {
      await deleteArticle(id);
      setMessage('게시글을 삭제했습니다.');
      await fetchArticles(meta.page);
    } catch (err) {
      console.error('[Admin Articles] delete failed', err);
      setError(err?.response?.data?.message ?? '삭제에 실패했습니다.');
    }
  };

  const submitArticle = async (event) => {
    event.preventDefault();
    if (!form.title?.trim() || !form.content?.trim() || !form.writer?.trim()) {
      setError('제목, 작성자, 본문을 모두 입력해 주세요.');
      return;
    }

    const payload = {
      title: form.title,
      content: form.content,
      imageUrl: form.imageUrl,
      thumbnailUrl: form.thumbnailUrl,
      writer: form.writer,
      category: form.category,
    };

    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (editingId) {
        await updateArticle(editingId, payload);
        setMessage('게시글이 수정되었습니다.');
      } else {
        await createArticle(payload);
        setMessage('새 게시글이 등록되었습니다.');
      }
      resetForm();
      await fetchArticles(1);
    } catch (err) {
      console.error('[Admin Articles] save failed', err);
      setError(err?.response?.data?.message ?? '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const uploadAndSetField = async (file, field) => {
    if (!file) return;
    try {
      const result = await uploadArticleImage(file);
      const url = resolveUploadUrl(result);
      if (url) {
        setForm((prev) => ({ ...prev, [field]: url }));
        setMessage('이미지를 업로드했습니다.');
      }
    } catch (err) {
      console.error('[Admin Articles] upload failed', err);
      setError('이미지 업로드에 실패했습니다.');
    }
  };

  const handleContentImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const result = await uploadArticleImage(file);
      const url = resolveUploadUrl(result);
      if (!url) return;
      setForm((prev) => ({
        ...prev,
        content: `${prev.content}\n<p><img src="${url}" alt="article-image" /></p>`,
      }));
      setMessage('본문 이미지가 추가되었습니다.');
    } catch (err) {
      console.error('[Admin Articles] rich text upload failed', err);
      setError('본문 이미지 업로드에 실패했습니다.');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    } else if (!isAdmin) {
      router.replace('/');
    }
  }, [isAuthenticated, isAdmin, router]);

  if (!canManage) {
    return (
      <div className="screen-padding section mx-auto flex w-full max-w-3xl flex-col items-center gap-4 text-center">
        <p className="text-lg font-semibold text-neutral-900">접근 권한이 없습니다.</p>
        <p className="text-sm text-neutral-500">관리자 계정으로 로그인해 주세요.</p>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.size));

  return (
    <div className="screen-padding section mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">Admin · Articles</p>
        <h1 className="text-4xl font-semibold text-neutral-900">게시판 관리</h1>
        <p className="text-neutral-600">카테고리, 검색, 게시글 작성·수정을 한 화면에서 처리하세요.</p>
      </header>

      <section className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
        <form
          className="flex flex-col gap-3 md:flex-row md:items-center"
          onSubmit={(event) => {
            event.preventDefault();
            fetchArticles(1);
          }}
        >
          <select
            value={filters.category}
            onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
            className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">전체 카테고리</option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="search"
            value={filters.keyword}
            onChange={(event) => setFilters((prev) => ({ ...prev, keyword: event.target.value }))}
            placeholder="키워드 검색"
            className="flex-1 rounded-2xl border border-neutral-200 px-4 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-2xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
          >
            검색
          </button>
        </form>

        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">제목</th>
                <th className="px-4 py-3">카테고리</th>
                <th className="px-4 py-3">작성자</th>
                <th className="px-4 py-3">조회수</th>
                <th className="px-4 py-3 text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-medium text-neutral-800">{article.title}</td>
                  <td className="px-4 py-3 text-neutral-500">{article.category}</td>
                  <td className="px-4 py-3 text-neutral-500">{article.writer || 'FineArt'}</td>
                  <td className="px-4 py-3 text-neutral-500">{article.views}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(article)}
                        className="rounded-full border border-neutral-200 px-3 py-1 text-xs"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(article.id)}
                        className="rounded-full border border-rose-200 px-3 py-1 text-xs text-rose-600"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                    표시할 게시글이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
          <span>
            총 {meta.total}건 · {meta.page}/{totalPages} 페이지
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fetchArticles(Math.max(1, meta.page - 1))}
              disabled={meta.page <= 1}
              className="rounded-full border border-neutral-200 px-3 py-1 disabled:opacity-50"
            >
              이전
            </button>
            <button
              type="button"
              onClick={() => fetchArticles(Math.min(totalPages, meta.page + 1))}
              disabled={meta.page >= totalPages}
              className="rounded-full border border-neutral-200 px-3 py-1 disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-neutral-900">
            {editingId ? '게시글 수정' : '새 게시글 작성'}
          </h2>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-sm text-primary">
              새 글로 전환
            </button>
          )}
        </div>

        {(message || error) && (
          <p
            className={`mt-4 rounded-2xl px-4 py-2 text-sm ${
              error ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {error || message}
          </p>
        )}

        <form onSubmit={submitArticle} className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-neutral-700">
              제목
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                required
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2 focus:border-primary focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-neutral-700">
              작성자
              <input
                value={form.writer}
                onChange={(event) => setForm((prev) => ({ ...prev, writer: event.target.value }))}
                required
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2 focus:border-primary focus:outline-none"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm font-medium text-neutral-700">
              카테고리
              <select
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2 focus:border-primary focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-neutral-700">
              대표 이미지 URL
              <div className="mt-1 flex gap-2">
                <input
                  value={form.imageUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-2 focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => heroInputRef.current?.click()}
                  className="rounded-2xl border border-neutral-200 px-3 text-xs"
                >
                  업로드
                </button>
              </div>
            </label>

            <label className="text-sm font-medium text-neutral-700">
              썸네일 URL
              <div className="mt-1 flex gap-2">
                <input
                  value={form.thumbnailUrl}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, thumbnailUrl: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-2 focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => thumbInputRef.current?.click()}
                  className="rounded-2xl border border-neutral-200 px-3 text-xs"
                >
                  업로드
                </button>
              </div>
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-neutral-700">본문 내용 (HTML 지원)</span>
              <button
                type="button"
                onClick={() => contentImageRef.current?.click()}
                className="text-primary"
              >
                본문 이미지 추가
              </button>
            </div>
            <textarea
              value={form.content}
              onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
              placeholder="HTML 또는 단순 텍스트로 내용을 작성해 주세요. 이미지 버튼으로 <img> 태그가 자동 삽입됩니다."
              className="min-h-[260px] w-full rounded-2xl border border-neutral-200 p-4 font-mono text-sm focus:border-primary focus:outline-none"
            />
            <p className="text-xs text-neutral-500">
              미리보기 위젯 대신 HTML을 직접 작성합니다. 기본 텍스트만 입력해도 문제없으며, 이미지 버튼을 누르면 &lt;img&gt;
              태그가 자동으로 추가됩니다.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-neutral-200 px-4 py-2 text-sm"
              disabled={saving}
            >
              초기화
            </button>
            <button
              type="submit"
              className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={saving}
            >
              {editingId ? '수정하기' : '등록하기'}
            </button>
          </div>
        </form>
      </section>

      {loading && (
        <p className="text-center text-sm text-neutral-500">게시글을 불러오는 중입니다...</p>
      )}

      <input
        ref={heroInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          uploadAndSetField(event.target.files?.[0], 'imageUrl');
          event.target.value = '';
        }}
      />
      <input
        ref={thumbInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          uploadAndSetField(event.target.files?.[0], 'thumbnailUrl');
          event.target.value = '';
        }}
      />
      <input
        ref={contentImageRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleContentImageUpload}
      />
    </div>
  );
}
