import Link from 'next/link';
import { notFound } from 'next/navigation';
import BoardDetailActions from '../BoardDetailActions';
import BoardSidebar from '@/components/BoardSidebar';
import { getBoardArticleById, getBoardBySlug } from '@/lib/api';
import { findFallbackArticle, getFallbackBoard } from '@/lib/boardFallbacks';

export const revalidate = 0;

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const isHtmlContent = (value) => /<\/?[a-z][\s\S]*>/i.test(value ?? '');

async function fetchArticle(id, slug) {
  if (!id) return null;
  try {
    const payload = await getBoardArticleById(slug, id);
    return { ...payload, isFallback: false };
  } catch (error) {
    console.error('[Board] Failed to load article detail:', error);
    const fallback = findFallbackArticle(slug, id);
    if (!fallback) return null;
    return {
      ...fallback,
      isFallback: true,
      board: getFallbackBoard(slug) ?? { slug },
    };
  }
}

async function resolveBoard(slug) {
  if (!slug) return null;
  try {
    const payload = await getBoardBySlug(slug);
    return payload;
  } catch {
    return getFallbackBoard(slug);
  }
}

export default async function BoardArticleDetailPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const id = resolvedParams?.id;
  const article = await fetchArticle(id, slug);

  if (!article) {
    notFound();
  }

  let board = article.board ?? article.Board;
  if ((!board || !board.slug) && slug) {
    board = await resolveBoard(slug);
  }

  const content = article.content ?? '';
  const html = isHtmlContent(content);

  return (
    <div className="min-h-screen bg-[var(--board-bg)]">
      <div className="screen-padding mx-auto w-full max-w-screen-2xl py-6">
        <div className="flex gap-6 lg:gap-10">
          <BoardSidebar activeSlug={board?.slug ?? slug} />
          <div className="flex min-w-0 flex-1 flex-col gap-6 max-w-3xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href={`/boards/${board?.slug ?? slug ?? ''}`}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 transition hover:border-neutral-900 hover:text-neutral-900"
              >
                목록으로
              </Link>
              <div className="text-xs" style={{ color: 'var(--board-text-secondary)' }}>
                {article.isFallback && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">
                    임시 데이터
                  </span>
                )}
              </div>
            </div>

            <article
              className="space-y-6 rounded-3xl border p-8 shadow-sm bg-[var(--board-bg)]"
              style={{ borderColor: 'var(--board-border)' }}
            >
              <div className="space-y-3 border-b pb-5" style={{ borderColor: 'var(--board-border)' }}>
                <p className="text-xs uppercase tracking-[0.35em]" style={{ color: 'var(--board-text-secondary)' }}>
                  {article.category || '카테고리'}
                </p>
                <h1 className="text-3xl font-semibold" style={{ color: 'var(--board-text)' }}>{article.title}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: 'var(--board-text-secondary)' }}>
                  <span>{article.writer ?? article.author ?? 'FineArt'}</span>
                  <span>·</span>
                  <span>{formatDate(article.createdAt)}</span>
                  <span>·</span>
                  <span>조회 {article.views?.toLocaleString?.() ?? article.views ?? 0}</span>
                </div>
              </div>

              <div className="prose prose-neutral max-w-none text-base leading-relaxed" style={{ color: 'var(--board-text)' }}>
                {html ? (
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                ) : (
                  content
                    .split('\n')
                    .filter((line) => line.trim().length > 0)
                    .map((line, index) => <p key={`line-${index}`}>{line}</p>)
                )}
              </div>

              <div className="flex items-center justify-between border-t pt-4 text-sm" style={{ borderColor: 'var(--board-border)', color: 'var(--board-text-secondary)' }}>
                <p>
                  게시판 · <span className="font-semibold" style={{ color: 'var(--board-text)' }}>{board?.name ?? slug}</span>
                </p>
                <BoardDetailActions
                  boardSlug={board?.slug ?? slug}
                  articleId={article.id}
                  articleEmail={article.email}
                  articleWriter={article.writer ?? article.author}
                />
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
