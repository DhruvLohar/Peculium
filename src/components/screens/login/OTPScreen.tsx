import React, { memo, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Container } from '@/components/Container';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import CustomText from '@/components/atoms/CustomText';
import { otpSchema, type OTPFormValues } from '@/utils/schemas';

interface OTPScreenProps {
  email: string;
  onVerify: (otp: string) => void;
  onResend: () => void;
  isLoading?: boolean;
  serverError?: string;
}

const OTPScreen: React.FC<OTPScreenProps> = ({
  email,
  onVerify,
  onResend,
  isLoading = false,
  serverError,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OTPFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  const handleFormSubmit = (data: OTPFormValues) => {
    onVerify(data.otp);
  };

  const handleResend = useCallback(() => {
    reset();
    onResend();
  }, [onResend, reset]);

  return (
    <Container>
      {/* Header Section - Top Left */}
      <View className="pt-8 pb-12">
        <Text className="font-head text-4xl mb-2 text-foreground">
          peculium
        </Text>
        <CustomText variant="p" className="text-muted-foreground">
          Main Character Energy!
        </CustomText>
      </View>

      {/* OTP Form - Vertically Centered */}
      <View className="flex-1 justify-center">
        <View className="gap-6">
          <View>
            <Text className="font-head text-3xl text-foreground mb-2">
              Check Your Email
            </Text>
            <CustomText variant="p" className="text-muted-foreground">
              We sent a code to{' '}
              <CustomText variant="p" className="font-semibold text-foreground">
                {email}
              </CustomText>
            </CustomText>
          </View>

          <View>
            <Controller
              control={control}
              name="otp"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="Enter 6-digit code"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoCapitalize="none"
                  isInvalid={!!errors.otp}
                />
              )}
            />
            {errors.otp && (
              <CustomText variant="p" className="text-destructive mt-2">
                {errors.otp.message}
              </CustomText>
            )}
          </View>

          {serverError && (
            <CustomText variant="p" className="text-destructive -mt-2">
              {serverError}
            </CustomText>
          )}

          <Button
            onPress={handleSubmit(handleFormSubmit)}
            variant="default"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </Button>

          <View className="flex-row justify-center items-center gap-2">
            <CustomText variant="p" className="text-muted-foreground">
              Didn't receive a code?
            </CustomText>
            <Pressable onPress={handleResend} disabled={isLoading}>
              <CustomText
                variant="p"
                className="font-semibold text-foreground underline"
              >
                Resend
              </CustomText>
            </Pressable>
          </View>
        </View>
      </View>
    </Container>
  );
};

export default memo(OTPScreen);
