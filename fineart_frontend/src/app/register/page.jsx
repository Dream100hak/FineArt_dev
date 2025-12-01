'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import api from '@/lib/api';

const ROLE_OPTIONS = [
  { value: 'User', label: '일반 사용자' },
  { value: 'Admin', label: '관리자' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(ROLE_OPTIONS[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await api.post('/auth/register', { email, password, role });
      alert('회원가입이 완료되었습니다. 로그인 후 이용해 주세요.');
      router.push('/login');
    } catch (error) {
      const message = error?.response?.data?.message ?? '회원가입에 실패했습니다.';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="screen-padding section mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="space-y-2 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">FineArt Studio</p>
        <h1 className="text-3xl font-semibold text-neutral-900">회원가입</h1>
        <p className="text-sm text-neutral-600">역할을 선택하고 FineArt 커뮤니티에 참여해 보세요.</p>
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
        <label className="block text-sm font-medium text-neutral-700">
          역할 선택
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2.5 focus:border-primary focus:outline-none"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? '처리 중...' : '회원가입'}
        </button>
        <p className="text-center text-sm text-neutral-500">
          이미 계정이 있다면{' '}
          <Link href="/login" className="text-primary underline-offset-4 hover:underline">
            로그인
          </Link>
        </p>
      </form>
    </div>
  );
}
