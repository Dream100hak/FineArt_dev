'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import api from '@/lib/api';
import { persistAuthSession } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (!data?.token) {
        throw new Error('로그인 토큰이 응답에 없습니다.');
      }

      persistAuthSession(data.token, data.role, email);
      router.push('/');
    } catch (error) {
      const message = error?.response?.data?.message ?? '이메일 또는 비밀번호가 올바르지 않습니다.';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="screen-padding section mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="space-y-2 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">FineArt Studio</p>
        <h1 className="text-3xl font-semibold text-neutral-900">로그인</h1>
        <p className="text-sm text-neutral-600">관리자 또는 회원 계정으로 FineArt 서비스를 이용하세요.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl border border-neutral-100 bg-white px-6 py-8 shadow-sm"
      >
        <label className="block text-sm font-medium text-neutral-700">
          이메일
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2.5 focus:border-primary focus:outline-none"
          />
        </label>
        <label className="block text-sm font-medium text-neutral-700">
          비밀번호
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2.5 focus:border-primary focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? '로그인 중...' : '로그인'}
        </button>
        <p className="text-center text-sm text-neutral-500">
          아직 계정이 없다면{' '}
          <Link href="/register" className="text-primary underline-offset-4 hover:underline">
            회원가입
          </Link>
        </p>
      </form>
    </div>
  );
}
