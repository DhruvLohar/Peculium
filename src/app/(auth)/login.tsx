import React, { memo, useCallback, useState } from 'react';
import LoginScreen from '@/components/screens/login/LoginScreen';
import OTPScreen from '@/components/screens/login/OTPScreen';
import { useUserAuth } from '@/hooks/useUserAuth';

type Step = 'email' | 'otp';

const LoginPage: React.FC = () => {
  const { sendOtp, verifyOtp } = useUserAuth();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');

  const handleSendOtp = useCallback(
    async (emailInput: string) => {
      setEmail(emailInput);
      try {
        await sendOtp.mutateAsync(emailInput);
        setStep('otp');
      } catch (error) {
        console.error(error);
      }
    },
    [sendOtp],
  );

  const handleVerifyOtp = useCallback(
    async (otp: string) => {
      try {
        await verifyOtp.mutateAsync({ email, token: otp });
        // Navigation is handled reactively by RootLayoutNav via useAuthState
      } catch (error) {
        console.error(error);
      }
    },
    [email, verifyOtp],
  );

  const handleResendOtp = useCallback(async () => {
    try {
      await sendOtp.mutateAsync(email);
    } catch (error) {
      console.error(error)
    }
  }, [email, sendOtp]);

  if (step === 'otp') {
    return (
      <OTPScreen
        email={email}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        isLoading={verifyOtp.isPending || sendOtp.isPending}
        serverError={verifyOtp.error?.message ?? sendOtp.error?.message}
      />
    );
  }

  return (
    <LoginScreen
      onSubmit={handleSendOtp}
      isLoading={sendOtp.isPending}
      serverError={sendOtp.error?.message}
    />
  );
};

export default memo(LoginPage);
