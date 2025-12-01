'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiChevronDown,
  FiFeather,
  FiGrid,
  FiLogIn,
  FiLogOut,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import useDecodedAuth from '@/hooks/useDecodedAuth';
import { clearAuthSession } from '@/lib/auth';
import { getBoardsSidebar } from '@/lib/api';
import { BOARDS_UPDATED_EVENT } from '@/lib/boardEvents';
import { buildFallbackSidebarTree } from '@/lib/boardFallbacks';

const MAIN_LINKS = [
  { href: '/exhibitions', label: '전시' },
  { href: '/sales', label: '판매' },
  { href: '/artists', label: '작가' },
];

const formatGreeting = (email) => {
  if (!email) return 'Guest';
  const [nick] = email.split('@');
  return nick?.length ? nick : email;
};

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, decodedEmail, decodedRole } = useDecodedAuth();
  const isAdmin = decodedRole === 'admin';

  const [isBoardsOpen, setIsBoardsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [boardTree, setBoardTree] = useState([]);
  const [collapsedMap, setCollapsedMap] = useState({});
  const boardMenuRef = useRef(null);

  const activeSegment = useMemo(() => {
    if (!pathname) return '/';
    const matchedMain = MAIN_LINKS.find((link) => link.href !== '/' && pathname.startsWith(link.href));
    if (matchedMain) return matchedMain.href;
    if (pathname.startsWith('/boards')) return '/boards';
    return '/';
  }, [pathname]);

  const showArtistAdmin = isAdmin;

  const loadBoards = useCallback(async () => {
    try {
      const payload = await getBoardsSidebar();
      setBoardTree(payload?.items ?? []);
    } catch (error) {
      console.warn('[TopNav] Failed to load boards, using fallback:', error);
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

  useEffect(() => {
    setIsBoardsOpen(false);
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!boardMenuRef.current) return;
      if (!boardMenuRef.current.contains(event.target)) {
        setIsBoardsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleNode = (nodeId) =>
    setCollapsedMap((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));

  const handleLogout = () => {
    clearAuthSession();
    setIsMobileOpen(false);
    router.push('/');
  };

  const renderAuthActions = (variant = 'desktop') => {
    if (isAuthenticated) {
      return (
        <div className={`flex items-center gap-2 ${variant === 'mobile' ? 'justify-between' : ''}`}>
          <span className="text-xs uppercase tracking-wide text-neutral-500">
            {formatGreeting(decodedEmail)} ({decodedRole ?? 'user'})
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-800 px-4 py-1.5 text-neutral-800 transition hover:bg-neutral-900 hover:text-white"
          >
            <FiLogOut /> 로그아웃
          </button>
        </div>
      );
    }

    return (
      <Link
        href="/login"
        onClick={() => setIsMobileOpen(false)}
        className="inline-flex items-center gap-2 rounded-full border border-neutral-800 px-4 py-1.5 text-neutral-800 transition hover:bg-neutral-900 hover:text-white"
      >
        <FiLogIn /> 로그인
      </Link>
    );
  };

  const renderBoardNodes = (nodes = [], depth = 0) =>
    nodes.map((node) => {
      const href = `/boards/${node.slug}`;
      const hasChildren = Array.isArray(node.children) && node.children.length > 0;
      const isCollapsed = collapsedMap[node.id];

      return (
        <div key={node.id} className="space-y-1">
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-neutral-800 transition hover:bg-white/70"
            style={{ paddingLeft: `${depth * 12}px` }}
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
            <Link
              href={href}
              onClick={() => setIsMobileOpen(false)}
              className="flex-1 text-neutral-800"
            >
              {node.name}
            </Link>
          </div>
          {hasChildren && !isCollapsed && (
            <div className="pl-3">{renderBoardNodes(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });

  const boardGroups = boardTree.length ? boardTree : [];

  const boardButtonClass = pathname?.startsWith('/boards') || isBoardsOpen
    ? 'bg-neutral-900 text-white shadow-md'
    : 'text-neutral-800 hover:bg-neutral-900/10';

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg">
                <FiFeather />
              </div>
              FineArt
            </Link>
            <div className="hidden items-center gap-1 text-xs uppercase tracking-[0.25em] text-neutral-400 sm:flex">
              <span>Archive</span>
              <span className="text-neutral-300">•</span>
              <span>Digital Gallery</span>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            {MAIN_LINKS.map((link) => {
              const isActive = activeSegment === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-md ring-1 ring-neutral-900/40 hover:text-white'
                      : 'text-neutral-700 hover:bg-neutral-900/10 hover:text-neutral-900'
                  }`}
                  style={isActive ? { color: '#ffffff' } : undefined}
                >
                  <span className={isActive ? 'text-white' : ''}>{link.label}</span>
                </Link>
              );
            })}
            {showArtistAdmin && (
              <Link
                href="/admin/artists"
                className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:border-sky-400 hover:bg-sky-100"
              >
                관리
              </Link>
            )}
            <div className="relative" ref={boardMenuRef}>
              <button
                type="button"
                onClick={() => setIsBoardsOpen((prev) => !prev)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${boardButtonClass}`}
              >
                <FiGrid /> 게시판
                <FiChevronDown
                  size={14}
                  className={`transition ${isBoardsOpen ? 'rotate-180' : 'rotate-0'}`}
                />
              </button>

              {isBoardsOpen && (
                <div className="absolute left-1/2 top-[calc(100%+14px)] z-50 w-[720px] -translate-x-1/2 rounded-3xl border border-neutral-200 bg-white/90 p-6 shadow-2xl backdrop-blur-lg">
                  <div className="flex items-center justify-between pb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-neutral-400">Boards</p>
                      <h3 className="text-lg font-semibold text-neutral-900">주제별 게시판 모아보기</h3>
                    </div>
                    {isAdmin && (
                      <Link
                        href="/admin/boards"
                        className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-800 transition hover:border-neutral-900 hover:text-neutral-900"
                      >
                        보드 관리
                      </Link>
                    )}
                  </div>

                  {boardGroups.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500">
                      게시판을 불러오는 중입니다.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {boardGroups.map((group) => (
                        <div
                          key={group.id}
                          className="group rounded-2xl border border-neutral-100 bg-neutral-50/70 p-4 transition hover:-translate-y-1 hover:border-neutral-200 hover:shadow-lg"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <Link
                              href={`/boards/${group.slug}`}
                              className="flex items-center gap-2 text-sm font-semibold text-neutral-900"
                            >
                              <span className="h-2 w-2 rounded-full bg-primary" />
                              {group.name}
                            </Link>
                            <FiChevronDown
                              size={14}
                              className="text-neutral-300 transition group-hover:translate-x-1 group-hover:text-neutral-500"
                            />
                          </div>
                          <p className="mt-2 text-xs text-neutral-500 line-clamp-2">
                            {group.description ?? '게시판으로 이동'}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(group.children ?? []).map((child) => (
                              <Link
                                key={child.id}
                                href={`/boards/${child.slug}`}
                                className="rounded-full bg-white px-3 py-1 text-xs text-neutral-700 transition hover:bg-neutral-900 hover:text-white"
                              >
                                {child.name}
                              </Link>
                            ))}
                            {(!group.children || group.children.length === 0) && (
                              <Link
                                href={`/boards/${group.slug}`}
                                className="rounded-full bg-white px-3 py-1 text-xs text-neutral-700 transition hover:bg-neutral-900 hover:text-white"
                              >
                                바로가기
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {renderAuthActions()}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="inline-flex items-center rounded-full border border-neutral-300 p-2 text-neutral-700 shadow-sm transition hover:border-neutral-900 hover:text-neutral-900 md:hidden"
            aria-label="Open navigation"
          >
            <FiMenu />
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-50 bg-white/90 backdrop-blur transition ${
          isMobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!isMobileOpen}
        onClick={() => setIsMobileOpen(false)}
      >
        <div
          className={`absolute left-1/2 top-6 w-[92vw] max-w-md -translate-x-1/2 rounded-3xl border border-neutral-200 bg-white p-5 shadow-2xl transition ${
            isMobileOpen ? 'translate-y-0' : '-translate-y-4'
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-white shadow-md">
                <FiFeather />
              </div>
              FineArt
            </div>
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="rounded-full border border-neutral-200 p-2 text-neutral-500 transition hover:border-neutral-400 hover:text-neutral-800"
              aria-label="Close navigation"
            >
              <FiX />
            </button>
          </div>

          <div className="space-y-2">
            {MAIN_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className={`block rounded-2xl px-4 py-3 text-base font-semibold transition ${
                  activeSegment === link.href
                    ? 'bg-neutral-900 text-white shadow-md'
                    : 'bg-neutral-50 text-neutral-800 hover:bg-neutral-900/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {showArtistAdmin && (
              <Link
                href="/admin/artists"
                onClick={() => setIsMobileOpen(false)}
                className="block rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 transition hover:border-sky-400 hover:bg-sky-100"
              >
                관리
              </Link>
            )}

            <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                  <FiGrid /> 게시판
                </div>
                {isAdmin && (
                  <Link
                    href="/admin/boards"
                    onClick={() => setIsMobileOpen(false)}
                    className="text-xs text-neutral-600 underline decoration-neutral-300 underline-offset-4"
                  >
                    관리
                  </Link>
                )}
              </div>
              {boardGroups.length === 0 ? (
                <p className="rounded-xl bg-white px-3 py-3 text-sm text-neutral-500">
                  게시판을 불러오는 중입니다.
                </p>
              ) : (
                <div className="space-y-1">{renderBoardNodes(boardGroups)}</div>
              )}
            </div>
          </div>

          <div className="mt-4 border-t border-neutral-200 pt-4">{renderAuthActions('mobile')}</div>
        </div>
      </div>
    </>
  );
}
