'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiChevronDown, FiGrid } from 'react-icons/fi';
import { getBoardsSidebar } from '@/lib/api';
import { BOARDS_UPDATED_EVENT } from '@/lib/boardEvents';
import { buildFallbackSidebarTree } from '@/lib/boardFallbacks';

const BoardSidebar = ({ activeSlug }) => {
  const pathname = usePathname();
  const [boardTree, setBoardTree] = useState([]);
  const [collapsedMap, setCollapsedMap] = useState({});

  const resolvedActiveSlug = useMemo(() => {
    if (activeSlug) return activeSlug;
    const match = pathname?.match(/^\/boards\/([^/]+)/);
    return match?.[1] ?? '';
  }, [activeSlug, pathname]);

  const loadBoards = useCallback(async () => {
    try {
      const payload = await getBoardsSidebar();
      setBoardTree(payload?.items ?? []);
    } catch (error) {
      console.warn('[BoardSidebar] Failed to load boards, using fallback:', error);
      setBoardTree(buildFallbackSidebarTree());
    }
  }, []);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handler = () => {
      loadBoards();
    };
    window.addEventListener(BOARDS_UPDATED_EVENT, handler);
    return () => window.removeEventListener(BOARDS_UPDATED_EVENT, handler);
  }, [loadBoards]);

  const toggleNode = (nodeId) =>
    setCollapsedMap((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));

  const renderBoardNodes = (nodes = [], depth = 0) =>
    nodes.map((node) => {
      const href = `/boards/${node.slug}`;
      const hasChildren = Array.isArray(node.children) && node.children.length > 0;
      const isCollapsed = collapsedMap[node.id];
      const isActive = resolvedActiveSlug === node.slug;

      return (
        <div key={node.id} className="space-y-1">
          <div
            className={`group flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
              isActive
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'text-neutral-800 hover:bg-neutral-900/10'
            }`}
            style={{ paddingLeft: `${depth * 12}px` }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleNode(node.id)}
                aria-label="Toggle board group"
                className={`text-xs transition ${isActive ? 'text-white/80' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                <FiChevronDown
                  size={12}
                  className={`transition ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
                />
              </button>
            ) : (
              <span
                className={`h-2 w-2 rounded-full ${isActive ? 'bg-white' : 'bg-emerald-500'}`}
                aria-hidden
              />
            )}
            <Link href={href} className="flex-1 truncate">
              {node.name}
            </Link>
          </div>
          {hasChildren && !isCollapsed && (
            <div className="space-y-1 border-l border-dashed border-neutral-200 pl-2">
              {renderBoardNodes(node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-20 space-y-4 rounded-3xl border border-neutral-200 bg-white/80 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between text-sm font-semibold text-neutral-900">
          <div className="flex items-center gap-2">
            <FiGrid /> 게시판
          </div>
          <Link
            href="/admin/boards"
            className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900"
          >
            관리
          </Link>
        </div>

        {boardTree.length === 0 ? (
          <p className="rounded-2xl border border-neutral-100 bg-white px-3 py-3 text-xs text-neutral-500">
            게시판을 불러오는 중입니다.
          </p>
        ) : (
          <div className="space-y-1">{renderBoardNodes(boardTree)}</div>
        )}
      </div>
    </aside>
  );
};

export default BoardSidebar;
