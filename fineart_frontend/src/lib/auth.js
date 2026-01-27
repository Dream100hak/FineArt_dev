import { createClient } from './supabase';

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

// Broadcast auth change event
export const broadcastAuthChange = () => {
  if (typeof window === 'undefined') return;
  console.log('[Auth] Broadcasting auth change event');
  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
};

// Legacy function - kept for compatibility
export const persistAuthSession = async (token, explicitRole, email) => {
  if (typeof window === 'undefined') return;

  try {
    const supabase = createClient();
    
    // Wait a bit for Supabase to sync
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session && explicitRole) {
      try {
        await supabase.auth.updateUser({
          data: { role: explicitRole },
        });
        
        await supabase
          .from('profiles')
          .upsert({
            id: session.user.id,
            email: email || session.user.email,
            role: explicitRole,
          });
      } catch (updateError) {
        console.warn('[Auth] Failed to update user metadata:', updateError);
      }
    }
    
    // Broadcast change multiple times to ensure UI updates
    broadcastAuthChange();
    setTimeout(() => broadcastAuthChange(), 100);
    setTimeout(() => broadcastAuthChange(), 300);
  } catch (error) {
    console.error('[Auth] Failed to persist session:', error);
    // Still broadcast even on error
    broadcastAuthChange();
  }
};

export const clearAuthSession = async () => {
  if (typeof window === 'undefined') return;

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('[Auth] Sign out error:', error);
    }
    
    // Broadcast change immediately
    broadcastAuthChange();
  } catch (error) {
    console.error('[Auth] Failed to clear session:', error);
    broadcastAuthChange();
  }
};

export const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    const supabase = createClient();
    // This is async but we can't wait - return null for now
    return null;
  } catch {
    return null;
  }
};

export const decodeJwtPayload = (token) => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch {
    return null;
  }
};

export const AUTH_CHANGE_EVENT = AUTH_EVENT_NAME;
