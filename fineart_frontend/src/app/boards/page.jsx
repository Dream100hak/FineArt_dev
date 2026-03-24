import { redirect } from 'next/navigation';
import { getBoardsSidebar } from '@/lib/api';
import { buildFallbackSidebarTree } from '@/lib/boardFallbacks';

function findFirstBoardSlug(nodes = []) {
  for (const node of nodes) {
    if (node?.slug) return node.slug;
    if (Array.isArray(node?.children) && node.children.length > 0) {
      const nested = findFirstBoardSlug(node.children);
      if (nested) return nested;
    }
  }
  return '';
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

  const firstSlug = findFirstBoardSlug(boardTree);
  if (firstSlug) {
    redirect(`/boards/${firstSlug}`);
  }

  return null;
}
