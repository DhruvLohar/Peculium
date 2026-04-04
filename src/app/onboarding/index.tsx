import React, { memo, useCallback } from 'react';
import OnboardingNameScreen from '@/components/screens/onboarding/OnboardingNameScreen';
import { useUserAuth } from '@/hooks/useUserAuth';

const OnboardingPage: React.FC = () => {
  const { completeOnboarding } = useUserAuth();

  const handleContinue = useCallback(
    async (name: string) => {
      try {
        await completeOnboarding.mutateAsync(name);
      } catch {
        // error surfaced via completeOnboarding.error
      }
    },
    [completeOnboarding],
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
