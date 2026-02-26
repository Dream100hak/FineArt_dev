'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase';
import {
  FiFeather,
  FiLogIn,
  FiLogOut,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import useDecodedAuth from '@/hooks/useDecodedAuth';
import { clearAuthSession } from '@/lib/auth';

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
  const auth = useDecodedAuth();
  const { isAuthenticated, decodedEmail, decodedRole } = auth;
  const isAdmin = decodedRole === 'admin';
  
  // Force re-render when auth state changes
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    // Listen for auth changes and force update
    const handler = () => {
      console.log('[TopNav] Auth change event received, forcing update');
      forceUpdate({});
    };
    
    window.addEventListener('fineart:auth-changed', handler);
    
    // Also check session on mount
    const checkSession = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('[TopNav] Session found on mount:', session.user.email);
          handler();
        }
      } catch (error) {
        console.error('[TopNav] Session check error:', error);
      }
    };
    
    checkSession();
    
    return () => {
      window.removeEventListener('fineart:auth-changed', handler);
    };
  }, []);
  
  // Debug log
  useEffect(() => {
    console.log('[TopNav] Render with auth state:', {
      isAuthenticated,
      email: decodedEmail,
      role: decodedRole,
    });
  }, [isAuthenticated, decodedEmail, decodedRole]);

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const activeSegment = useMemo(() => {
    if (!pathname) return '/';
    const matchedMain = MAIN_LINKS.find((link) => link.href !== '/' && pathname.startsWith(link.href));
    if (matchedMain) return matchedMain.href;
    if (pathname.startsWith('/boards')) return '/boards';
    return '/';
  }, [pathname]);

  const showArtistAdmin = isAdmin;

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setIsMobileOpen(false);
    
    try {
      await clearAuthSession();
      // Immediately redirect
      window.location.href = '/';
    } catch (error) {
      console.error('[TopNav] Logout error:', error);
      // Still redirect even on error
      window.location.href = '/';
    }
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

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg">
                <FiFeather />
              </div>
              Fineart.co.kr
            </Link>
          </div>

          <nav className="hidden items-center gap-2 pt-[10px] pl-[63px] ml-[42px] mr-[42px] md:flex">
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
          </nav>

          <div className="ml-auto hidden items-center gap-3 md:flex">
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
              Fineart.co.kr
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

            <Link
              href="/boards"
              onClick={() => setIsMobileOpen(false)}
              className={`block rounded-2xl px-4 py-3 text-base font-semibold transition ${
                activeSegment === '/boards'
                  ? 'bg-neutral-900 text-white shadow-md'
                  : 'bg-neutral-50 text-neutral-800 hover:bg-neutral-900/10'
              }`}
            >
              게시판
            </Link>
          </div>

          <div className="mt-4 border-t border-neutral-200 pt-4">{renderAuthActions('mobile')}</div>
        </div>
      </div>
    </>
  );
}
