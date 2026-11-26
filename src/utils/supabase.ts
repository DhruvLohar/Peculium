import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

// Same value supabase-js derives by default, spelled out so we can read the persisted session directly
const AUTH_STORAGE_KEY = `sb-${supabaseUrl.replace(/^https?:\/\//, '').split('.')[0]}-auth-token`;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    storageKey: AUTH_STORAGE_KEY,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Supabase's token-refresh lock can be left held if the app backgrounds mid-refresh,
// which then hangs every future getSession()/getUser() call. Pausing/resuming
// auto-refresh on foreground/background (per Supabase's RN guidance) avoids that.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }
});

/**
 * Local, no-network read of the current user (from the persisted session), for query hooks that
 * are about to make an authenticated request anyway - the server re-validates the JWT via RLS on
 * every request regardless, so there's no security gained by round-tripping through
 * `getUser()` first. `getUser()` hits `/auth/v1/user` over the network with no timeout, so on a
 * flaky local connection it can hang forever and leave the calling query stuck in `isLoading`.
 */
export const getSessionUser = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (__DEV__) {
    if (error) {
      console.warn('[auth] getSession error:', error.message);
    } else if (!session) {
      console.warn('[auth] no session - user is signed out');
    } else {
      const expiresInSec = (session.expires_at ?? 0) - Math.floor(Date.now() / 1000);
      console.log('[auth] session ok', {
        userId: session.user.id,
        email: session.user.email,
        expiresInSec,
        expired: expiresInSec <= 0,
      });
    }
  }

  return session?.user ?? null;
};

/**
 * Whether a session is persisted on the device, without touching the network. Supabase only removes
 * the stored session on an explicit sign-out or a rejected refresh token, so if one is here the user is
 * still signed in - even when getSession() can't refresh an expired access token because we're offline.
 */
export const getPersistedUserId = async (): Promise<string | null> => {
  try {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as { refresh_token?: string; user?: { id?: string } };
    return stored.refresh_token && stored.user?.id ? stored.user.id : null;
  } catch {
    return null;
  }
};

export default supabase;
