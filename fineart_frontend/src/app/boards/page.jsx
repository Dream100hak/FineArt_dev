import BoardsDirectoryClient from './BoardsDirectoryClient';
import { getBoards } from '@/lib/api';
import { buildFallbackBoardsPayload } from '@/lib/boardFallbacks';

export const metadata = {
  title: '게시판 · FineArt Archive',
  description: '공지, 뉴스, 전시·행사, 커뮤니티 게시판을 한 곳에서 탐색하세요.',
};

async function fetchInitialBoards() {
  try {
    const payload = await getBoards({ page: 1, size: 20, sort: 'order' });
    return { ...payload, isFallback: false, error: null };
  } catch (error) {
    console.error('[Boards] Failed to load boards:', error);
    const fallback = buildFallbackBoardsPayload();
    return {
      ...fallback,
      error: '게시판 목록을 불러오지 못해 샘플 데이터를 보여줍니다.',
      isFallback: true,
    };
  }
}

export default async function BoardsPage() {
  const initialData = await fetchInitialBoards();

  return (
    <div className="bg-[#f7f4d7]/60">
      <BoardsDirectoryClient initialData={initialData} />
    </div>
  );
}
