'use client';

import { usePathname } from 'next/navigation';
import BoardSidebar from '@/components/BoardSidebar';

const PATHS_WITHOUT_SIDEBAR = ['/', '/login', '/register'];

export default function MainWithSidebar({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const skipSidebar = PATHS_WITHOUT_SIDEBAR.includes(pathname) || isAdmin;

  if (skipSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="screen-padding-with-sidebar w-full py-4 min-h-[calc(100vh-12rem)] bg-[var(--board-bg)]">
      <div className="flex gap-0 min-h-full items-stretch">
        <BoardSidebar />
        <div className="flex min-w-0 flex-1 flex-col bg-[var(--board-bg)] pl-52 max-w-[99rem]">{children}</div>
      </div>
    </div>
  );
}
