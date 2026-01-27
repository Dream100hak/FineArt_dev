'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

const ROLE_OPTIONS = [
  { value: 'user', label: '일반 사용자' },
  { value: 'admin', label: '관리자' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(ROLE_OPTIONS[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Listen for auth state changes and redirect
  useEffect(() => {
    const supabase = createClient();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[RegisterPage] Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('[RegisterPage] User signed in, redirecting...');
        setTimeout(() => {
          window.location.replace('/');
        }, 100);
      }
    });

    // Check if already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('[RegisterPage] Already logged in, redirecting...');
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
    setSuccessMessage('');

    try {
      const supabase = createClient();
      
      // Sign up with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role.toLowerCase(),
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!authData?.user) {
        throw new Error('회원가입에 실패했습니다.');
      }

      // Profile will be created automatically by trigger
      // But we can also explicitly create/update it
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: email,
          role: role.toLowerCase(),
        });

      if (profileError) {
        console.warn('[Register] Failed to create profile:', profileError);
        // Don't throw - profile might be created by trigger
      }

      setIsSubmitting(false);

      // Check if email confirmation is required
      if (!authData.user.email_confirmed_at && authData.user.confirmation_sent_at) {
        // Email confirmation required
        setSuccessMessage('회원가입이 완료되었습니다. 이메일 확인 링크를 보내드렸습니다.');
        
        setTimeout(() => {
          window.location.replace('/login');
        }, 2000);
        return;
      } else if (authData.session) {
        // User is already confirmed (autoconfirm is enabled)
        setSuccessMessage('회원가입이 완료되었습니다! 페이지를 이동합니다...');
        
        // Immediately trigger auth change event to update UI
        window.dispatchEvent(new Event('fineart:auth-changed'));
        
        // The onAuthStateChange listener will handle redirect
        // But also set a fallback timeout
        setTimeout(() => {
          window.location.replace('/');
        }, 1000);
        return;
      } else {
        // Fallback - no session
        setSuccessMessage('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다...');
        
        setTimeout(() => {
          window.location.replace('/login');
        }, 2000);
        return;
      }
    } catch (error) {
      const message = error?.message ?? '회원가입에 실패했습니다.';
      setError(message);
      console.error('[Register] Sign up error:', error);
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
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="rounded-2xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            {successMessage}
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
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
            className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2.5 focus:border-primary focus:outline-none disabled:opacity-50"
          />
          <p className="mt-1 text-xs text-neutral-500">최소 6자 이상 입력해주세요.</p>
        </label>
        <label className="block text-sm font-medium text-neutral-700">
          역할 선택
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            disabled={isSubmitting}
            className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2.5 focus:border-primary focus:outline-none disabled:opacity-50"
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
