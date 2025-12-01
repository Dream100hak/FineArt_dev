import { notFound } from 'next/navigation';
import BoardArticlesClient from './BoardArticlesClient';
import { getBoardArticles, getBoardBySlug } from '@/lib/api';
import { getFallbackArticlesPayload, getFallbackBoard } from '@/lib/boardFallbacks';

export const revalidate = 0;

const PAGE_SIZE = 12;

async function fetchBoard(slug) {
  if (!slug) return null;
  try {
    const payload = await getBoardBySlug(slug);
    return { ...payload, isFallback: false };
  } catch (error) {
    console.error('[Board] Failed to load board info:', error);
    return getFallbackBoard(slug);
  }
}

async function fetchInitialArticles(slug) {
  if (!slug) {
    return {
      board: null,
      items: [],
      total: 0,
      page: 1,
      size: PAGE_SIZE,
      isFallback: true,
      error: '게시글을 불러오지 못했습니다.',
    };
  }

  try {
    const payload = await getBoardArticles(slug, { page: 1, size: PAGE_SIZE });
    return { ...payload, isFallback: false, error: null };
  } catch (error) {
    console.error('[Board] Failed to load articles:', error);
    const fallback = getFallbackArticlesPayload(slug);
    return { ...fallback, error: '게시글을 불러오지 못해 샘플 데이터를 표시합니다.' };
  }
}

export async function generateMetadata({ params }) {
  const resolved = await params;
  const slug = resolved?.slug ?? 'board';
  return {
    title: `${slug} 게시판 · FineArt`,
  };
}

export default async function BoardSlugPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const board = await fetchBoard(slug);

  if (!board) {
    notFound();
  }

  const initialArticles = await fetchInitialArticles(board.slug ?? slug);

  return (
    <div className="bg-[#f7f4d7]/60">
      <BoardArticlesClient board={board} initialData={initialArticles} />
    </div>
  );
}
