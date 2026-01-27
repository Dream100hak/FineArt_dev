'use client';

import { useEffect, useState, useCallback } from 'react';
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
    console.log('[useAuthContext] State changed:', newState);
    
    // Broadcast event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('fineart:auth-changed'));
    }
    
    // Notify listeners
    globalListeners.forEach(listener => {
      try {
        listener(newState);
      } catch (error) {
        console.error('[useAuthContext] Listener error:', error);
      }
    });
  }
};

const buildSnapshot = async (session) => {
  if (!session?.user) {
    return defaultValue;
  }

  const user = session.user;
  const profile = user.user_metadata || {};
  
  // Get role from user metadata
  let role = normalizeRole(profile?.role || 'user');
  
  // Try to get role from profiles table if not in metadata
  if (!role || role === 'user') {
    try {
      const supabase = createClient();
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profileData?.role) {
        role = normalizeRole(profileData.role);
      }
    } catch (error) {
      // Ignore - use metadata role
    }
  }
  
  return {
    isAuthenticated: true,
    role,
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
      console.error('[useAuthContext] Session error:', error);
      updateGlobalState(defaultValue);
      return;
    }
    
    if (session) {
      const snapshot = await buildSnapshot(session);
      updateGlobalState(snapshot);
    } else {
      updateGlobalState(defaultValue);
    }
  } catch (error) {
    console.error('[useAuthContext] Check session error:', error);
    updateGlobalState(defaultValue);
  }
};

// Initialize Supabase listener once
const initSupabaseListener = () => {
  if (typeof window === 'undefined' || supabaseSubscription) return;
  
  try {
    const supabase = createClient();
    
    supabaseSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuthContext] Auth state changed:', event, session?.user?.email);
      
      if (session) {
        const snapshot = await buildSnapshot(session);
        updateGlobalState(snapshot);
      } else {
        updateGlobalState(defaultValue);
      }
    });
    
    // Initial check
    checkSession();
  } catch (error) {
    console.error('[useAuthContext] Failed to init listener:', error);
  }
};

// Initialize on module load
if (typeof window !== 'undefined') {
  initSupabaseListener();
}

export default function useAuthContext() {
  const [state, setState] = useState(globalAuthState);
  
  useEffect(() => {
    // Subscribe to global state changes
    const listener = (newState) => {
      setState(newState);
    };
    
    globalListeners.add(listener);
    
    // Force check on mount
    checkSession();
    
    return () => {
      globalListeners.delete(listener);
    };
  }, []);
  
  // Also check session periodically to catch any missed updates
  useEffect(() => {
    const interval = setInterval(() => {
      checkSession();
    }, 2000); // Check every 2 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return state;
}
