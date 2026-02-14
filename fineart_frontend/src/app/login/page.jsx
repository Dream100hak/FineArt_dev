'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 이미 로그인된 경우 홈으로
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.replace('/');
      }
    });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      const supabase = createClient();
      
      // Sign in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (!data?.session) {
        throw new Error('로그인 세션이 생성되지 않았습니다.');
      }

      // 전역 auth 상태 동기화 후 리다이렉트 (관리자/일반 사용자 동일)
      window.dispatchEvent(new Event('fineart:auth-changed'));
      setTimeout(() => {
        window.location.replace('/');
      }, 500);
      
    } catch (error) {
      const code = error?.code ?? error?.status;
      let message = error?.message ?? '이메일 또는 비밀번호가 올바르지 않습니다.';
      let hint = '';
      // Supabase: 이메일 미확인 시 로그인 불가
      if (
        code === 'email_not_confirmed' ||
        String(message).toLowerCase().includes('email not confirmed') ||
        String(message).toLowerCase().includes('confirm your mail')
      ) {
        message = '가입 시 발송된 이메일의 확인 링크를 먼저 눌러 주세요.';
        hint = '이메일을 받지 못했거나 만료되었다면, 새 계정으로 다시 가입해 보세요.';
      } else if (String(message).toLowerCase().includes('invalid login')) {
        message = '이메일 또는 비밀번호가 올바르지 않습니다.';
        hint = '새 계정으로 가입한 뒤 다시 시도해 보세요.';
      }
      setError(hint ? `${message} ${hint}` : message);
      console.error('[Login] Sign in error:', error);
      setIsSubmitting(false);
    }
  };


  return (
    <div className="screen-padding section mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center gap-8 py-12">
      <div className="space-y-3 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.3em]" style={{ color: 'var(--board-text-secondary)' }}>
          FineArt Studio
        </p>
        <h1 className="text-4xl font-bold" style={{ color: 'var(--board-text)' }}>
          로그인
        </h1>
        <p className="text-sm" style={{ color: 'var(--board-text-secondary)' }}>
          관리자 또는 회원 계정으로 FineArt 서비스를 이용하세요.
        </p>
      </div>

      <div
        className="rounded-3xl border p-6 shadow-sm sm:p-8"
        style={{ backgroundColor: 'var(--board-bg)', borderColor: 'var(--board-border)' }}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <label className="block text-sm font-medium" style={{ color: 'var(--board-text)' }}>
            이메일
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
              className="mt-1.5 w-full rounded-2xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 disabled:opacity-50"
              style={{ borderColor: 'var(--board-border)' }}
            />
          </label>
          <label className="block text-sm font-medium" style={{ color: 'var(--board-text)' }}>
            비밀번호
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              className="mt-1.5 w-full rounded-2xl border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 disabled:opacity-50"
              style={{ borderColor: 'var(--board-border)' }}
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-[var(--primary)] py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
          <p className="text-center text-sm" style={{ color: 'var(--board-text-secondary)' }}>
            아직 계정이 없다면{' '}
            <Link href="/register" className="text-[var(--primary)] underline-offset-4 hover:underline">
              회원가입
            </Link>
          </p>
          <p className="text-center text-xs" style={{ color: 'var(--board-text-secondary)' }}>
            로그인이 되지 않으면 새 계정을 만들어 보세요.
          </p>
        </form>
      </div>
    </div>
  );
}
