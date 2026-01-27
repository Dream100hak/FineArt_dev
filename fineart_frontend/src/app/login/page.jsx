'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Listen for auth state changes and redirect
  useEffect(() => {
    const supabase = createClient();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[LoginPage] Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('[LoginPage] User signed in, redirecting...');
        // Use setTimeout to ensure state is updated
        setTimeout(() => {
          window.location.replace('/');
        }, 100);
      }
    });

    // Check if already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('[LoginPage] Already logged in, redirecting...');
        window.location.replace('/');
      }
    };
    
    checkSession();

    return () => {
      subscription.unsubscribe();
    };
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

      console.log('[LoginPage] Sign in successful, session:', data.session?.user?.email);
      
      // Immediately trigger auth change event to update UI
      window.dispatchEvent(new Event('fineart:auth-changed'));
      
      // Don't set submitting to false - let useEffect handle redirect
      // The onAuthStateChange listener will trigger the redirect
      
    } catch (error) {
      const message = error?.message ?? '이메일 또는 비밀번호가 올바르지 않습니다.';
      setError(message);
      console.error('[Login] Sign in error:', error);
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
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium text-neutral-700">
          이메일
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
            className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2.5 focus:border-primary focus:outline-none disabled:opacity-50"
          />
        </label>
        <label className="block text-sm font-medium text-neutral-700">
          비밀번호
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
            className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2.5 focus:border-primary focus:outline-none disabled:opacity-50"
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
