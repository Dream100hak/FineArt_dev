import { jwtDecode } from 'jwt-decode';
import { EMAIL_STORAGE_KEY, ROLE_STORAGE_KEY, TOKEN_COOKIE_KEY, TOKEN_STORAGE_KEY } from './api';

const AUTH_EVENT_NAME = 'fineart:auth-changed';

const defaultSnapshot = Object.freeze({
  isAuthenticated: false,
  role: null,
  name: null,
  email: null,
  token: null,
});

const normalizeRole = (role) =>
  typeof role === 'string' && role.trim().length > 0 ? role.trim().toLowerCase() : null;

const readCookieToken = () => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE_KEY}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

export const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    const token = window.localStorage?.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      return token;
    }
  } catch {
    // ignored
  }

  return readCookieToken();
};

const getStoredRole = () => {
  if (typeof window === 'undefined') return null;
  try {
    return normalizeRole(window.localStorage?.getItem(ROLE_STORAGE_KEY));
  } catch {
    return null;
  }
};

const getStoredEmail = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage?.getItem(EMAIL_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const decodeJwtPayload = (token) => {
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
};

const ROLE_CLAIM_KEYS = [
  'role',
  'Role',
  'roles',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
];

const resolveRoleFromPayload = (payload) => {
  if (!payload) return null;

  for (const key of ROLE_CLAIM_KEYS) {
    if (key === 'roles' && Array.isArray(payload.roles) && payload.roles.length > 0) {
      return payload.roles[0];
    }

    if (key !== 'roles' && payload[key]) {
      return payload[key];
    }
  }

  return null;
};

let cachedSnapshot = defaultSnapshot;
let cachedToken = null;

const isPayloadExpired = (payload) =>
  typeof payload?.exp === 'number' && payload.exp * 1000 <= Date.now();

const buildSnapshot = (token, roleHint, emailHint) => {
  if (!token) {
    return defaultSnapshot;
  }

  try {
    const payload = decodeJwtPayload(token);
    if (!payload) {
      return defaultSnapshot;
    }

    if (isPayloadExpired(payload)) {
      clearAuthSession();
      return defaultSnapshot;
    }

    const resolvedRole = normalizeRole(roleHint ?? resolveRoleFromPayload(payload));
    return {
      isAuthenticated: true,
      role: resolvedRole,
      name: payload?.name ?? payload?.nickname ?? payload?.sub ?? null,
      email: emailHint ?? payload?.email ?? payload?.sub ?? null,
      token,
    };
  } catch {
    return defaultSnapshot;
  }
};

const broadcastAuthChange = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
};

const writeRole = (role) => {
  if (typeof window === 'undefined') return;
  if (!role) {
    window.localStorage?.removeItem(ROLE_STORAGE_KEY);
    return;
  }

  window.localStorage?.setItem(ROLE_STORAGE_KEY, role);
};

const writeEmail = (email) => {
  if (typeof window === 'undefined') return;
  if (!email) {
    window.localStorage?.removeItem(EMAIL_STORAGE_KEY);
    return;
  }

  window.localStorage?.setItem(EMAIL_STORAGE_KEY, email);
};

export const persistAuthSession = (token, explicitRole, email) => {
  if (typeof window === 'undefined' || !token) return;

  window.localStorage?.setItem(TOKEN_STORAGE_KEY, token);
  if (email) {
    writeEmail(email);
  }

  const normalizedRole = normalizeRole(explicitRole);
  const snapshot = buildSnapshot(token, normalizedRole ?? getStoredRole(), email ?? getStoredEmail());
  writeRole(snapshot.role);

  cachedToken = token;
  cachedSnapshot = snapshot;
  broadcastAuthChange();
};

export const clearAuthSession = () => {
  if (typeof window === 'undefined') return;

  window.localStorage?.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage?.removeItem(ROLE_STORAGE_KEY);
  window.localStorage?.removeItem(EMAIL_STORAGE_KEY);
  cachedToken = null;
  cachedSnapshot = defaultSnapshot;
  broadcastAuthChange();
};

export const getAuthSnapshot = () => {
  if (typeof window === 'undefined') {
    return cachedSnapshot;
  }

  const token = getStoredToken();
  const roleHint = getStoredRole();
  const emailHint = getStoredEmail();
  if (token === cachedToken) {
    return cachedSnapshot;
  }

  cachedToken = token;
  cachedSnapshot = buildSnapshot(token, roleHint, emailHint);
  return cachedSnapshot;
};

export const AUTH_CHANGE_EVENT = AUTH_EVENT_NAME;
