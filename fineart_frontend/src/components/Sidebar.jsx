'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiChevronDown,
  FiFeather,
  FiLogIn,
  FiLogOut,
  FiMenu,
  FiPlus,
  FiX,
} from 'react-icons/fi';
import useDecodedAuth from '@/hooks/useDecodedAuth';
import { clearAuthSession } from '@/lib/auth';
import { getBoardsSidebar } from '@/lib/api';
import { buildFallbackSidebarTree } from '@/lib/boardFallbacks';
import { BOARDS_UPDATED_EVENT } from '@/lib/boardEvents';

const PRIMARY_LINKS = [
  { href: '/', label: '홈', color: 'bg-lime-700' },
  { href: '/exhibitions', label: '전시', color: 'bg-lime-500' },
  { href: '/sales', label: '판매', color: 'bg-amber-500' },
];

const INFO_LINKS = [
  { label: '이용 안내', href: '/articles' },
  { label: '개인정보처리방침', href: '/articles' },
  { label: '문의', href: '/boards' },
];

const CONTACT_INFO = [
  { label: 'neo@fineart.com', href: 'mailto:neo@fineart.com' },
  { label: 'Tel. 02_335_7922', href: 'tel:+82023357922' },
  { label: 'Fax. 02_335_7929', href: 'tel:+82023357929' },
];

const formatGreeting = (email) => {
  if (!email) return 'Guest';
  const [nick] = email.split('@');
  return nick?.length ? nick : email;
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, decodedEmail, decodedRole } = useDecodedAuth();
  const isAdmin = decodedRole === 'admin';

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [boardTree, setBoardTree] = useState([]);
  const [collapsedMap, setCollapsedMap] = useState({});

  const loadBoards = useCallback(async () => {
    try {
      const payload = await getBoardsSidebar();
      setBoardTree(payload?.items ?? []);
    } catch (error) {
      console.warn('[Sidebar] Failed to load boards, using fallback:', error);
      setBoardTree(buildFallbackSidebarTree());
    }
  }, []);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  useEffect(() => {
    if (typeof window === 'undefined') return () => {};
    const handler = () => {
      loadBoards();
    };
    window.addEventListener(BOARDS_UPDATED_EVENT, handler);
    return () => {
      window.removeEventListener(BOARDS_UPDATED_EVENT, handler);
    };
  }, [loadBoards]);

  const activeSegment = useMemo(() => {
    if (!pathname) return '/';
    if (pathname.startsWith('/exhibitions')) return '/exhibitions';
    if (pathname.startsWith('/sales')) return '/sales';
    if (pathname.startsWith('/boards')) return '/boards';
    return '/';
  }, [pathname]);

  const handleLogout = () => {
    clearAuthSession();
    setIsDrawerOpen(false);
    router.push('/');
  };

  const toggleNode = (nodeId) =>
    setCollapsedMap((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));

  const renderAuthActions = (variant = 'desktop') => {
    if (isAuthenticated) {
      return (
        <div className={`flex flex-col gap-2 text-sm ${variant === 'desktop' ? '' : 'items-start'}`}>
          <span className="text-xs uppercase tracking-wide text-neutral-600">
            {formatGreeting(decodedEmail)} ({decodedRole ?? 'user'})
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-full border border-neutral-800 px-4 py-1.5 text-neutral-800 transition hover:bg-neutral-900 hover:text-white"
          >
            <FiLogOut /> 로그아웃
          </button>
        </div>
      );
    }

    return (
      <Link
        href="/login"
        onClick={() => setIsDrawerOpen(false)}
        className="flex items-center gap-2 rounded-full border border-neutral-800 px-4 py-1.5 text-neutral-800 transition hover:bg-neutral-900 hover:text-white"
      >
        <FiLogIn /> 로그인
      </Link>
    );
  };

  const renderPrimaryLink = (link) => (
    <Link
      key={link.href}
      href={link.href}
      onClick={() => setIsDrawerOpen(false)}
      className={`flex items-center gap-3 rounded-full px-4 py-2 text-sm font-semibold transition ${
        activeSegment === link.href
          ? 'bg-white/80 text-neutral-900 shadow-inner'
          : 'text-neutral-800 hover:bg-white/60'
      }`}
    >
      <span className={`h-3 w-3 rounded-full ${link.color}`} />
      {link.label}
    </Link>
  );

  const renderBoardNodes = (nodes = [], depth = 0) =>
    nodes.map((node) => {
      const href = `/boards/${node.slug}`;
      const isActive = pathname?.startsWith(href);
      const hasChildren = Array.isArray(node.children) && node.children.length > 0;
      const isCollapsed = collapsedMap[node.id];

      return (
        <div key={node.id} className="space-y-1">
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition ${
              isActive ? 'bg-white/70 text-neutral-900 shadow-inner' : 'text-neutral-700 hover:bg-white/50'
            }`}
            style={{ paddingLeft: `${16 + depth * 12}px` }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleNode(node.id)}
                aria-label="Toggle board group"
                className="text-xs text-neutral-500"
              >
                <FiChevronDown
                  size={12}
                  className={`transition ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
                />
              </button>
            ) : (
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            )}
            <Link href={href} onClick={() => setIsDrawerOpen(false)} className="flex-1">
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

  const navContent = (
    <div className="flex h-full flex-col justify-between bg-[#f5f1cf] px-6 py-8 text-neutral-900">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <FiFeather className="text-orange-500" />
            FineArt Archive
          </div>
          {isAdmin && (
            <Link
              href="/admin/boards"
              className="inline-flex items-center gap-1 rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900"
            >
              <FiPlus /> 관리
            </Link>
          )}
        </div>

        <div className="space-y-2">{PRIMARY_LINKS.map(renderPrimaryLink)}</div>

        <div className="my-4 border-t border-neutral-300" />
        <div className="space-y-2">{renderBoardNodes(boardTree)}</div>

        <div className="space-y-1 border-l-2 border-neutral-800/40 pl-4 text-xs text-neutral-600">
          {INFO_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className="block hover:text-neutral-900">
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-3 text-sm text-neutral-700">
        {renderAuthActions()}
        <div className="pt-4 text-xs text-neutral-600">
          <p className="font-semibold uppercase tracking-[0.3em] text-neutral-800">FineArt</p>
          <div className="mt-3 space-y-1">
            {CONTACT_INFO.map((contact) => (
              <a key={contact.label} href={contact.href} className="block hover:text-neutral-900">
                {contact.label}
              </a>
            ))}
          </div>
          <p className="mt-4 text-neutral-500">평일 10:00 ~ 15:00</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-neutral-200 bg-[#f5f1cf]/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2 text-base font-semibold">
          <FiFeather className="text-orange-500" />
          FineArt
        </div>
        <button
          type="button"
          onClick={() => setIsDrawerOpen((prev) => !prev)}
          aria-label="Toggle navigation"
          className="rounded border border-neutral-400 p-2"
        >
          {isDrawerOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      <aside className="hidden w-72 shrink-0 border-r border-neutral-200 bg-[#f5f1cf] lg:block">
        {navContent}
      </aside>

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-neutral-200 bg-[#f5f1cf] transition-transform lg:hidden ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </div>

      {isDrawerOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}
    </>
  );
}
