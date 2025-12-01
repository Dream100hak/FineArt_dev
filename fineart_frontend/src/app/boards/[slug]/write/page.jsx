import { notFound } from 'next/navigation';
import BoardEditorClient from './BoardEditorClient';
import { getArticleById, getBoardBySlug } from '@/lib/api';
import { getFallbackBoard } from '@/lib/boardFallbacks';

async function fetchBoard(slug) {
  if (!slug) return null;
  try {
    const payload = await getBoardBySlug(slug);
    return { ...payload, isFallback: false };
  } catch (error) {
    console.error('[Board] Failed to fetch board for editor:', error);
    return getFallbackBoard(slug);
  }
}

async function fetchArticle(articleId, boardSlug) {
  if (!articleId) return null;
  try {
    const payload = await getArticleById(articleId);
    if (boardSlug && payload?.board?.slug && payload.board.slug !== boardSlug) {
      return null;
    }
    return payload;
  } catch (error) {
    console.error('[Board] Failed to fetch article for editing:', error);
    return null;
  }
}

export default async function BoardWritePage({ params, searchParams }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const board = await fetchBoard(slug);

  if (!board) {
    notFound();
  }

  const resolvedSearch = await searchParams;
  const articleId = resolvedSearch?.articleId;
  const initialArticle = articleId ? await fetchArticle(articleId, board.slug) : null;

  if (articleId && !initialArticle) {
    notFound();
  }

  return (
    <div className="bg-[#f7f4d7]/60">
      <BoardEditorClient board={board} initialArticle={initialArticle} />
    </div>
  );
}
