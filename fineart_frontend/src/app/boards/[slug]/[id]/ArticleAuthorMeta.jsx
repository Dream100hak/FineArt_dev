'use client';

import useDecodedAuth from '@/hooks/useDecodedAuth';
import { formatBoardPostDate } from '@/lib/date';
import { formatWriterWithIp } from '@/lib/guestIdentity';

export default function ArticleAuthorMeta({ writer, guestIp, createdAt, views }) {
  const { isAuthenticated } = useDecodedAuth();

  const displayWriter = isAuthenticated
    ? (writer || 'FineArt')
    : formatWriterWithIp(writer || 'FineArt', guestIp);

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: 'var(--board-text-secondary)' }}>
      <span>{displayWriter}</span>
      <span>|</span>
      <span>{formatBoardPostDate(createdAt)}</span>
      <span>|</span>
      <span>조회 {views?.toLocaleString?.() ?? views ?? 0}</span>
    </div>
  );
}
