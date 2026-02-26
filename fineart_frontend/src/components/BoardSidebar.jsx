'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiChevronDown, FiGrid } from 'react-icons/fi';
import useDecodedAuth from '@/hooks/useDecodedAuth';
import { getBoardsSidebar } from '@/lib/api';
import { BOARDS_UPDATED_EVENT } from '@/lib/boardEvents';
import { buildFallbackSidebarTree } from '@/lib/boardFallbacks';

const HERO_SECTION_ID = 'hero-section';
/* IntersectionObserver rootMargin: 위쪽 120px 확장 → 히어로가 뷰포트 위 120px에 들어오면 미리 숨김 */
const HERO_PRELOAD_MARGIN = '120px 0px 0px 0px';

const BoardSidebar = ({ activeSlug, useFixedPosition = true }) => {
  const pathname = usePathname();
  const { decodedRole } = useDecodedAuth();
  const isAdmin = decodedRole === 'admin';
  const [boardTree, setBoardTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsedMap, setCollapsedMap] = useState({});
  const [isPastHero, setIsPastHero] = useState(false);

  useEffect(() => {
    if (useFixedPosition !== 'dynamic') return;
    const hero = document.getElementById(HERO_SECTION_ID);
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        /* 히어로가 확장된 뷰포트(위 120px)와 겹치면 → 곧 화면에 들어옴 → 미리 사이드바 숨김 */
        const heroApproaching = entry.isIntersecting;
        setIsPastHero(!heroApproaching);
      },
      {
        root: null,
        rootMargin: HERO_PRELOAD_MARGIN,
        threshold: 0,
      },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [useFixedPosition]);

  const resolvedActiveSlug = useMemo(() => {
    if (activeSlug) return activeSlug;
    const match = pathname?.match(/^\/boards\/([^/]+)/);
    return match?.[1] ?? '';
  }, [activeSlug, pathname]);

  const loadBoards = useCallback(async () => {
    setLoading(true);
    try {
      const timeoutMs = 8000;
      const payload = await Promise.race([
        getBoardsSidebar(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Boards load timeout')), timeoutMs),
        ),
      ]);
      const items = payload?.items ?? [];
      setBoardTree(items.length > 0 ? items : buildFallbackSidebarTree());
    } catch (error) {
      console.warn('[BoardSidebar] Failed to load boards, using fallback:', error);
      setBoardTree(buildFallbackSidebarTree());
    } finally {
      setLoading(false);
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
    nodes.map((node, idx) => {
      const href = `/boards/${node.slug}`;
      const hasChildren = Array.isArray(node.children) && node.children.length > 0;
      const isCollapsed = collapsedMap[node.id];
      const isActive = resolvedActiveSlug === node.slug;
      const colorIndex = (depth * 5 + idx) % PALETTE_COLORS.length;
      const dotColor = PALETTE_COLORS[colorIndex];

      return (
        <div key={node.id} className="space-y-0.5">
          <div
            className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition ${
              isActive
                ? 'bg-[var(--board-text)] text-white'
                : 'hover:bg-[var(--board-row-hover)]'
            }`}
            style={{ paddingLeft: `${depth * 10}px`, color: isActive ? 'white' : 'var(--board-text)' }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleNode(node.id)}
                aria-label="Toggle board group"
                className={`shrink-0 text-xs transition ${isActive ? 'text-white/80' : ''}`}
                style={!isActive ? { color: 'var(--board-text-secondary)' } : undefined}
              >
                <FiChevronDown
                  size={10}
                  className={`transition ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
                />
              </button>
            ) : (
              <span
                className="h-2 w-2 shrink-0 rounded-full flex-shrink-0"
                style={{ backgroundColor: isActive ? 'white' : dotColor }}
                aria-hidden
              />
            )}
            <Link href={href} className="flex-1 min-w-0 truncate text-[13px]">
              {node.name}
            </Link>
          </div>
          {hasChildren && !isCollapsed && (
            <div className="space-y-0.5 border-l border-dashed pl-1.5 ml-1" style={{ borderColor: 'var(--board-border)' }}>
              {renderBoardNodes(node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });

  const useFixed =
    useFixedPosition === true || useFixedPosition === 'dynamic';
  const positionClass = useFixed ? 'board-sidebar-fixed' : 'board-sidebar-sticky';
  const visibleWhenDynamic =
    useFixedPosition !== 'dynamic' || isPastHero;

  const PALETTE_COLORS = [
    '#e53935',
    '#ff7043',
    '#ffb74d',
    '#9ccc65',
    '#26a69a',
    '#1a5f4a',
    '#b39ddb',
    '#5c6bc0',
    '#7e57c2',
    '#ec407a',
  ];

  return (
    <aside className="hidden w-44 shrink-0 lg:block self-start">
      <div
        className={`space-y-2 py-3 pr-3 pl-4 border-r bg-[var(--board-bg)] flex flex-col overflow-y-auto overflow-x-hidden ${positionClass} ${useFixedPosition === 'dynamic' ? 'transition-opacity duration-150 ease-out' : ''} ${!visibleWhenDynamic ? 'opacity-0 pointer-events-none invisible' : 'opacity-100'}`}
        style={{ borderColor: 'var(--board-border)' }}
      >
        <div className="flex items-center justify-between gap-2 text-xs font-medium" style={{ color: 'var(--board-text)' }}>
          <span className="flex items-center gap-1.5">
            <FiGrid size={14} /> 게시판
          </span>
          {isAdmin && (
            <Link
              href="/admin/boards"
              className="rounded px-2 py-0.5 text-[11px] transition hover:opacity-80"
              style={{ borderColor: 'var(--board-border)', color: 'var(--board-text-secondary)' }}
            >
              관리
            </Link>
          )}
        </div>

        {boardTree.length === 0 && loading ? (
            <p className="px-2 py-2 text-[11px]" style={{ color: 'var(--board-text-secondary)' }}>
              불러오는 중…
            </p>
          ) : boardTree.length > 0 ? (
            <div className="space-y-0.5">{renderBoardNodes(boardTree)}</div>
          ) : (
            <p className="px-2 py-2 text-[11px]" style={{ color: 'var(--board-text-secondary)' }}>
              게시판이 없습니다.
            </p>
          )}
      </div>
    </aside>
  );
};

export default BoardSidebar;
