import { useMutation } from '@tanstack/react-query';
import supabase from '../utils/supabase';

interface VerifyOtpResult {
  needsOnboarding: boolean;
}

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

      const { error: updateError } = await supabase.auth.updateUser({
        data: { display_name: name },
      });
      if (updateError) throw new Error(updateError.message);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ has_onboarded: true, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (profileError) throw new Error(profileError.message);
    },
  });

  return { sendOtp, verifyOtp, completeOnboarding };
};
