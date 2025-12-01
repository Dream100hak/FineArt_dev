'use client';

import useDecodedAuth from '@/hooks/useDecodedAuth';

export default function AuthDebugBadge() {
  const { isAuthenticated, decodedEmail, decodedRole } = useDecodedAuth();

  return (
    <div className="rounded-full border border-dashed border-primary/40 bg-primary/5 px-4 py-1 text-xs text-primary">
      {isAuthenticated
        ? `${decodedEmail ?? '사용자'} (${decodedRole ?? 'unknown'})`
        : '게스트 (guest)'}
    </div>
  );
}
