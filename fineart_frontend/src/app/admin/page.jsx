'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useDecodedAuth from '@/hooks/useDecodedAuth';

const sections = [
  {
    title: 'Articles',
    description: '이벤트, 공지, 뉴스 게시글을 편집하고 퍼블리싱합니다.',
  },
  {
    title: 'Artists',
    description: '작가 등록, 소개/연락처 업데이트, 작품/전시를 연결합니다.',
    href: '/admin/artists',
  },
  {
    title: 'Artworks',
    description: '작품 이미지, 재료, 전시 이력과 판매 상태를 관리합니다.',
  },
];

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, decodedRole } = useDecodedAuth();
  const isAdmin = decodedRole === 'admin';

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    } else if (!isAdmin) {
      router.replace('/');
    }
  }, [isAuthenticated, isAdmin, router]);

  if (!isAdmin) {
    return (
      <div className="screen-padding section mx-auto flex w-full max-w-3xl flex-col items-center gap-4 text-center">
        <p className="text-lg font-semibold text-neutral-900">접근 권한이 없습니다.</p>
        <p className="text-sm text-neutral-500">관리자 계정으로 로그인해 주세요.</p>
      </div>
    );
  }

  return (
    <div className="screen-padding section mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">Admin Console</p>
        <h1 className="text-4xl font-semibold">관리자 대시보드</h1>
        <p className="text-neutral-600">콘텐츠와 커뮤니티 운영을 위한 메인 허브입니다.</p>
      </header>

      <section className="grid gap-5 md:grid-cols-3">
        {sections.map((section) => (
          <article key={section.title} className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase text-neutral-400">Manage</p>
            <h2 className="mt-3 text-2xl font-semibold">{section.title}</h2>
            <p className="mt-3 text-sm text-neutral-600">{section.description}</p>
            {section.href && (
              <a
                href={section.href}
                className="mt-4 inline-flex text-sm font-semibold text-primary underline decoration-1 underline-offset-4"
              >
                이동
              </a>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
