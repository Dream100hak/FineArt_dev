'use client';

import useAuthContext from './useAuthContext';

const normalizeRole = (role) =>
  typeof role === 'string' && role.trim().length > 0 ? role.trim().toLowerCase() : null;

export default function useDecodedAuth() {
  const auth = useAuthContext();

  return {
    ...auth,
    decodedRole: normalizeRole(auth.role),
    decodedEmail: auth.email ?? null,
  };
}
