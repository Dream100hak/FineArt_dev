'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

const defaultValue = {
  isAuthenticated: false,
  role: null,
  name: null,
  email: null,
  token: null,
};

const normalizeRole = (role) =>
  typeof role === 'string' && role.trim().length > 0 ? role.trim().toLowerCase() : null;

// Global state
let globalAuthState = defaultValue;
let globalListeners = new Set();
let supabaseSubscription = null;

const updateGlobalState = (newState) => {
  const changed =
    globalAuthState.isAuthenticated !== newState.isAuthenticated ||
    globalAuthState.email !== newState.email ||
    globalAuthState.role !== newState.role;

  globalAuthState = newState;

  if (changed) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('fineart:auth-changed'));
    }
    globalListeners.forEach((listener) => {
      try {
        listener(newState);
      } catch (err) {
        console.error('[useAuthContext] Listener error:', err);
      }
    });
  }
};

/**
 * 세션 → { isAuthenticated, role, name, email, token } 변환.
 * 예외 없이 동작하도록 내부에서 모두 처리. 관리자/일반 사용자 동일 적용.
 */
const buildSnapshot = async (session) => {
  if (!session?.user) {
    return defaultValue;
  }

  const user = session.user;
  const profile = user.user_metadata || {};

  // 역할: user_metadata 기준 (가입 시 선택한 일반사용자/관리자)
  let role = normalizeRole(profile?.role || 'user') || 'user';

  // profiles 테이블에서 역할 보강 (실패해도 metadata 유지)
  try {
    const supabase = createClient();
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profileError && profileData?.role) {
      const fromDb = normalizeRole(profileData.role);
      if (fromDb) {
        role = fromDb;
      }
    }
  } catch (_) {
    // 무시: metadata 역할 유지
  }

  const finalRole = role === 'admin' ? 'admin' : 'user';

  return {
    isAuthenticated: true,
    role: finalRole,
    name: profile?.name || profile?.nickname || user.email?.split('@')[0] || null,
    email: user.email || null,
    token: session.access_token || null,
  };
};

/**
 * session만으로 최소 스냅샷 생성 (buildSnapshot 실패 시 대체용). 예외 없음.
 */
const snapshotFromSessionOnly = (session) => {
  if (!session?.user) return defaultValue;
  const user = session.user;
  const profile = user.user_metadata || {};
  const role = normalizeRole(profile?.role || 'user') || 'user';
  return {
    isAuthenticated: true,
    role: role === 'admin' ? 'admin' : 'user',
    name: profile?.name || profile?.nickname || user.email?.split('@')[0] || null,
    email: user.email || null,
    token: session.access_token || null,
  };
};

const checkSession = async () => {
  try {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      updateGlobalState(defaultValue);
      return;
    }

    if (session) {
      try {
        const snapshot = await buildSnapshot(session);
        updateGlobalState(snapshot);
      } catch (_) {
        updateGlobalState(snapshotFromSessionOnly(session));
      }
    } else {
      updateGlobalState(defaultValue);
    }
  } catch (_) {
    updateGlobalState(defaultValue);
  }
};

const initSupabaseListener = () => {
  if (typeof window === 'undefined' || supabaseSubscription) return;

  try {
    const supabase = createClient();

    supabaseSubscription = supabase.auth.onAuthStateChange((event, session) => {
      try {
        if (session) {
          buildSnapshot(session).then(updateGlobalState).catch(() => {
            updateGlobalState(snapshotFromSessionOnly(session));
          });
        } else {
          updateGlobalState(defaultValue);
        }
      } catch (_) {
        if (session) {
          updateGlobalState(snapshotFromSessionOnly(session));
        } else {
          updateGlobalState(defaultValue);
        }
      }
    });

    window.addEventListener('fineart:auth-changed', () => {
      checkSession();
    });

    // 초기 세션 복원: 스토리지에서 읽을 수 있도록 다음 틱에 실행
    setTimeout(() => {
      checkSession();
    }, 0);
  } catch (err) {
    console.error('[useAuthContext] Init failed:', err);
  }
};

if (typeof window !== 'undefined') {
  initSupabaseListener();
}

export default function useAuthContext() {
  const [state, setState] = useState(globalAuthState);

  useEffect(() => {
    const listener = (newState) => setState(newState);
    globalListeners.add(listener);
    checkSession();
    return () => {
      globalListeners.delete(listener);
    };
  }, []);

  return state;
}
