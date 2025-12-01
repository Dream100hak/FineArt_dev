'use client';

import { useSyncExternalStore } from 'react';
import { AUTH_CHANGE_EVENT, getAuthSnapshot } from '@/lib/auth';

const defaultValue = {
  isAuthenticated: false,
  role: null,
  name: null,
  email: null,
  token: null,
};

const subscribe = (callback) => {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const handler = () => callback();
  window.addEventListener('storage', handler);
  window.addEventListener(AUTH_CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener(AUTH_CHANGE_EVENT, handler);
  };
};

export default function useAuthContext() {
  return useSyncExternalStore(subscribe, getAuthSnapshot, () => defaultValue);
}
