'use client';

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import useAuthContext from './useAuthContext';
import { TOKEN_STORAGE_KEY } from '@/lib/api';

const normalizeRole = (role) =>
  typeof role === 'string' && role.trim().length > 0 ? role.trim().toLowerCase() : null;

export default function useDecodedAuth() {
  const auth = useAuthContext();
  const [decoded, setDecoded] = useState({
    role: normalizeRole(auth.role),
    email: auth.email ?? null,
  });

  useEffect(() => {
    let cancelled = false;

    const applyDecoded = (next) => {
      if (typeof window === 'undefined' || cancelled) {
        return;
      }

      window.requestAnimationFrame(() => {
        if (!cancelled) {
          setDecoded(next);
        }
      });
    };

    if (typeof window === 'undefined') {
      return () => {
        cancelled = true;
      };
    }

    const compute = () => {
      const token = window.localStorage?.getItem(TOKEN_STORAGE_KEY);
      if (!token) {
        applyDecoded({ role: normalizeRole(auth.role), email: auth.email ?? null });
        return;
      }

      try {
        const payload = jwtDecode(token);
        const role =
          payload?.role ??
          payload?.Role ??
          payload?.roles?.[0] ??
          payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
          auth.role;

        applyDecoded({
          role: normalizeRole(role),
          email: payload?.email ?? payload?.sub ?? auth.email ?? null,
        });
      } catch {
        applyDecoded({ role: normalizeRole(auth.role), email: auth.email ?? null });
      }
    };

    compute();
    return () => {
      cancelled = true;
    };
  }, [auth.role, auth.email]);

  return {
    ...auth,
    decodedRole: decoded.role,
    decodedEmail: decoded.email,
  };
}
