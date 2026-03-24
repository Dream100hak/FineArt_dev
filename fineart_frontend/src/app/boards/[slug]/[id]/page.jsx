import { notFound } from 'next/navigation';
import BoardDetailActions from '../BoardDetailActions';
import { getBoardArticleById, getBoardArticles, getBoardBySlug } from '@/lib/api';
import { findFallbackArticle, getFallbackBoard } from '@/lib/boardFallbacks';
import ArticleAuthorMeta from './ArticleAuthorMeta';
import RelatedArticlesList from './RelatedArticlesList';

export const revalidate = 0;

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

async function fetchRelatedArticles(slug, currentId) {
  if (!slug) return [];
  try {
    const payload = await getBoardArticles(slug, { page: 1, size: 12 });
    return (payload?.items ?? []).filter((item) => String(item.id) !== String(currentId));
  } catch (error) {
    console.error('[Board] Failed to load related articles:', error);
    return [];
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
  const relatedArticles = await fetchRelatedArticles(board?.slug ?? slug, article.id);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-8">
      {article.isFallback && (
        <div className="text-xs" style={{ color: 'var(--board-text-secondary)' }}>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">임시 데이터</span>
        </div>
      )}

      <article className="space-y-6 py-2 bg-[var(--board-bg)]">
        <div className="space-y-3 border-b pb-5" style={{ borderColor: 'var(--board-border)' }}>
          <h1 className="text-3xl font-semibold" style={{ color: 'var(--board-text)' }}>{article.title}</h1>
          <ArticleAuthorMeta
            writer={article.writer ?? article.author ?? 'FineArt'}
            guestIp={article.guestIp ?? article.guest_ip}
            createdAt={article.createdAt}
            views={article.viewCount ?? article.view_count ?? article.views ?? 0}
          />
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

        <div className="flex items-center justify-end border-t pt-4 text-sm" style={{ borderColor: 'var(--board-border)', color: 'var(--board-text-secondary)' }}>
          <BoardDetailActions
            boardSlug={board?.slug ?? slug}
            articleId={article.id}
            articleEmail={article.email}
            articleWriter={article.writer ?? article.author}
            articleIsGuest={String(article.author ?? '').endsWith('@fineart.local')}
          />
        </div>
      </article>

      <section className="space-y-3 border-t pt-6" style={{ borderColor: 'var(--board-border)' }}>
        <RelatedArticlesList
          board={board ?? { slug }}
          items={relatedArticles}
          excludeArticleId={article.id}
        />
      </section>
    </div>
  );
}
