import { useCallback, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import supabase from '../utils/supabase';

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
        await supabase.from('profiles').upsert({
          id: userId,
          has_onboarded: false,
          updated_at: new Date().toISOString(),
        });
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
  const { data: profile } = await supabase
    .from('profiles')
    .select('has_onboarded')
    .eq('id', userId)
    .single();

  return profile?.has_onboarded ? 'authenticated' : 'needs-onboarding';
};

/**
 * Hook to monitor auth state changes and return the current state
 */
export const useAuthState = () => {
  const [authState, setAuthState] = useState<AuthState>('loading');

  const updateAuthState = useCallback(async (userId: string) => {
    const state = await resolveAuthState(userId);
    setAuthState(state);
  }, []);

  useEffect(() => {
    // Bootstrap: check for an existing session immediately so we don't
    // rely solely on onAuthStateChange (which can race with mutations).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        updateAuthState(session.user.id);
      } else {
        setAuthState('unauthenticated');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setAuthState('unauthenticated');
        return;
      }
      await updateAuthState(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [updateAuthState]);

  return authState;
};
