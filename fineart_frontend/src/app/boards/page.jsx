import Link from 'next/link';
import { getBoardsSidebar } from '@/lib/api';
import { buildFallbackSidebarTree } from '@/lib/boardFallbacks';

function flattenBoardTree(nodes = [], depth = 0) {
  const result = [];
  for (const node of nodes) {
    result.push({ ...node, depth });
    if (Array.isArray(node.children) && node.children.length > 0) {
      result.push(...flattenBoardTree(node.children, depth + 1));
    }
  }
  return result;
}

export default async function BoardsIndexPage() {
  let boardTree = [];
  try {
    const payload = await getBoardsSidebar();
    const items = payload?.items ?? [];
    boardTree = items.length > 0 ? items : buildFallbackSidebarTree();
  } catch (error) {
    boardTree = buildFallbackSidebarTree();
  }

  const flatBoards = flattenBoardTree(boardTree);

  return (
    <div className="screen-padding section mx-auto flex w-full max-w-2xl flex-col gap-6 py-8 sm:py-10">
      <header
        className="rounded-3xl border p-6 shadow-sm"
        style={{ backgroundColor: 'var(--board-bg)', borderColor: 'var(--board-border)' }}
      >
        <p className="text-xs font-medium uppercase tracking-[0.3em]" style={{ color: 'var(--board-text-secondary)' }}>
          Boards
        </p>
        <h1 className="mt-1 text-3xl font-bold md:text-4xl" style={{ color: 'var(--board-text)' }}>
          게시판
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--board-text-secondary)' }}>
          원하는 게시판을 선택해 주세요
        </p>
      </header>

      <section
        className="rounded-3xl border p-4 shadow-sm sm:p-6"
        style={{ backgroundColor: 'var(--board-bg)', borderColor: 'var(--board-border)' }}
      >
        <div className="flex flex-col gap-2">
          {flatBoards.map((board) => (
            <Link
              key={board.id}
              href={`/boards/${board.slug}`}
              className="flex items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-[var(--board-row-hover)]"
              style={{
                paddingLeft: `${16 + (board.depth ?? 0) * 20}px`,
              }}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    board.depth > 0 ? 'var(--board-text-secondary)' : 'var(--board-notice-badge)',
                }}
                aria-hidden
              />
              <span className="font-medium" style={{ color: 'var(--board-text)' }}>
                {board.name}
              </span>
              <span className="ml-auto text-xs" style={{ color: 'var(--board-text-secondary)' }}>
                →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
