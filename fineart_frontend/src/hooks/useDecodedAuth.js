'use client';

import { useEffect, useState } from 'react';
import useAuthContext from './useAuthContext';

const normalizeRole = (role) =>
  typeof role === 'string' && role.trim().length > 0 ? role.trim().toLowerCase() : null;

export default function useDecodedAuth() {
  const auth = useAuthContext();
  const [decoded, setDecoded] = useState({
    role: normalizeRole(auth.role),
    email: auth.email ?? null,
  });

  useEffect(() => {
    setDecoded({
      role: normalizeRole(auth.role),
      email: auth.email ?? null,
    });
  }, [auth.role, auth.email, auth.isAuthenticated]);

  return {
    ...auth,
    decodedRole: decoded.role,
    decodedEmail: decoded.email,
  };
}
