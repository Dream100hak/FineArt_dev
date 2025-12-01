'use client';

import Link from 'next/link';
import useDecodedAuth from '@/hooks/useDecodedAuth';

export default function ArtistsManageButton() {
  const { isAuthenticated, decodedRole } = useDecodedAuth();
  const isAdmin = decodedRole === 'admin';

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <Link
      href="/admin/artists"
      className="inline-flex items-center justify-center rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
    >
      관리
    </Link>
  );
}
