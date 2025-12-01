'use client';

import { useEffect } from 'react';
import ErrorState from '@/components/ErrorState';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('App Router error:', error);
  }, [error]);

  return (
    <div className="screen-padding section mx-auto max-w-3xl">
      <ErrorState
        title="콘텐츠를 불러오지 못했습니다."
        description="잠시 후 다시 시도하거나 새로고침 해 주세요."
      />
      <div className="mt-4 text-center text-sm text-neutral-600">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full border border-primary px-5 py-2 text-primary"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
