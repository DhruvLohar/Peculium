import { useCallback, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import supabase, { getPersistedUserId } from '../utils/supabase';

interface VerifyOtpResult {
  needsOnboarding: boolean;
}

export type AuthState = 'loading' | 'unauthenticated' | 'needs-onboarding' | 'authenticated';

export const useUserAuth = () => {
  const sendOtp = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) throw new Error(error.message);
    },
  });

  const verifyOtp = useMutation({
    mutationFn: async ({
      email,
      token,
    }: {
      email: string;
      token: string;
    }): Promise<VerifyOtpResult> => {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error || !data.user) {
        throw new Error(error?.message ?? 'Verification failed');
      }

      const userId = data.user.id;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('has_onboarded')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        const { error: upsertError } = await supabase.from('profiles').upsert({
          id: userId,
          has_onboarded: false,
          updated_at: new Date().toISOString(),
        });
        if (upsertError) throw new Error(upsertError.message);
        return { needsOnboarding: true };
      }

      return { needsOnboarding: !profile.has_onboarded };
    },
  });

  const completeOnboarding = useMutation({
    mutationFn: async (name: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('No authenticated user');

      // Update profile FIRST so that when updateUser triggers onAuthStateChange,
      // resolveAuthState reads has_onboarded: true and doesn't bounce back to onboarding.
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ has_onboarded: true, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (profileError) throw new Error(profileError.message);

      const { error: updateError } = await supabase.auth.updateUser({
        data: { display_name: name },
      });
      if (updateError) throw new Error(updateError.message);
    },
  });

  return { sendOtp, verifyOtp, completeOnboarding };
};

/**
 * Resolves the auth state for a given user ID
 * Checks the profiles table to determine if onboarding is needed
 */
export const resolveAuthState = async (userId: string): Promise<AuthState> => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('has_onboarded')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return profile?.has_onboarded ? 'authenticated' : 'needs-onboarding';
};

/**
 * Hook to monitor auth state changes and return the current state
 */
export const useAuthState = () => {
  const [authState, setAuthState] = useState<AuthState>('loading');

  const updateAuthState = useCallback(async (userId: string) => {
    try {
      const state = await resolveAuthState(userId);
      setAuthState(state);
    } catch (error) {
      console.error('Failed to resolve auth state:', error);
      setAuthState('authenticated');
    }
  }, []);

  useEffect(() => {
    // Bootstrap: check for an existing session immediately so we don't
    // rely solely on onAuthStateChange (which can race with mutations).
    // getSession() can hang forever if Supabase's internal refresh lock was
    // left held (e.g. app backgrounded mid-refresh), so guard it with a
    // timeout instead of leaving the splash screen stuck.
    let settled = false;

    // An expired access token makes getSession() refresh over the network, which fails or stalls
    // offline. That isn't a sign-out: if the session is still persisted, stay signed in and let
    // auto-refresh catch up (TOKEN_REFRESHED / SIGNED_OUT below settle it once we're back online).
    const resolveFromStorage = async () => {
      const userId = await getPersistedUserId();
      setAuthState(userId ? 'authenticated' : 'unauthenticated');
    };

    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        console.warn('Auth session check timed out; falling back to persisted session.');
        void resolveFromStorage();
      }
    }, 8000);

    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        if (session) {
          updateAuthState(session.user.id);
        } else if (error) {
          // A rejected refresh token has already cleared storage, so this only keeps network failures signed in
          console.warn('Failed to refresh auth session:', error.message);
          void resolveFromStorage();
        } else {
          setAuthState('unauthenticated');
        }
      })
      .catch((error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        console.error('Failed to read auth session:', error);
        void resolveFromStorage();
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // Never await Supabase calls inside this callback: auth-js runs it while holding its session
        // lock, and the profile query below needs that same lock - awaiting it here deadlocks every
        // later query (they all hang in "fetching"). Deferring lets the lock release first.
        const userId = session.user.id;
        setTimeout(() => void updateAuthState(userId), 0);
      } else if (event === 'SIGNED_OUT') {
        setAuthState('unauthenticated');
      }
      // A null INITIAL_SESSION means the startup refresh failed; the bootstrap above handles it
    });

    return () => {
      settled = true;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [updateAuthState]);

  return authState;
};
