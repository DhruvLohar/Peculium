import React, { memo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import OnboardingNameScreen from '../../components/screens/onboarding/OnboardingNameScreen';
import { useUserAuth } from '../../hooks/useUserAuth';

const OnboardingPage: React.FC = () => {
  const router = useRouter();
  const { completeOnboarding } = useUserAuth();

  const handleContinue = useCallback(
    async (name: string) => {
      try {
        await completeOnboarding.mutateAsync(name);
        router.replace('/(tabs)');
      } catch {
        // error surfaced via completeOnboarding.error
      }
    },
    [completeOnboarding, router],
  );

  return (
    <OnboardingNameScreen
      onContinue={handleContinue}
      isLoading={completeOnboarding.isPending}
      serverError={completeOnboarding.error?.message}
    />
  );
};

export default memo(OnboardingPage);
