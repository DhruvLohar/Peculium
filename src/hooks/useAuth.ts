import { useState, useCallback } from 'react';
import supabase from '../utils/supabase';

interface VerifyOtpResult {
  success: boolean;
  needsOnboarding: boolean;
  error?: string;
}

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = useCallback(async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (otpError) {
        setError(otpError.message);
        setIsLoading(false);
        return false;
      }

      setIsLoading(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(errorMessage);
      setIsLoading(false);
      return false;
    }
  }, []);

  const verifyOtp = useCallback(
    async (email: string, token: string): Promise<VerifyOtpResult> => {
      setIsLoading(true);
      setError(null);

      try {
        // Verify the OTP
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'email',
        });

        if (verifyError || !data.user) {
          const errorMessage = verifyError?.message || 'Verification failed';
          setError(errorMessage);
          setIsLoading(false);
          return { success: false, needsOnboarding: false, error: errorMessage };
        }

        const userId = data.user.id;

        // Check if profile exists and get onboarding status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('has_onboarded')
          .eq('id', userId)
          .single();

        // If profile doesn't exist, create it
        if (profileError || !profile) {
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              has_onboarded: false,
              updated_at: new Date().toISOString(),
            });

          if (upsertError) {
            console.error('Failed to create profile:', upsertError);
          }

          setIsLoading(false);
          return { success: true, needsOnboarding: true };
        }

        setIsLoading(false);
        return {
          success: true,
          needsOnboarding: !profile.has_onboarded,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Verification failed';
        setError(errorMessage);
        setIsLoading(false);
        return { success: false, needsOnboarding: false, error: errorMessage };
      }
    },
    [],
  );

  const completeOnboarding = useCallback(async (name: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('No authenticated user');
        setIsLoading(false);
        return false;
      }

      // Update user metadata with display name
      const { error: updateError } = await supabase.auth.updateUser({
        data: { display_name: name },
      });

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return false;
      }

      // Mark onboarding as complete in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          has_onboarded: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) {
        setError(profileError.message);
        setIsLoading(false);
        return false;
      }

      setIsLoading(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Onboarding failed';
      setError(errorMessage);
      setIsLoading(false);
      return false;
    }
  }, []);

  return {
    sendOtp,
    verifyOtp,
    completeOnboarding,
    isLoading,
    error,
  };
};
