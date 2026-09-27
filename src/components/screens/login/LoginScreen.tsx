import React, { memo } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Container } from '@/components/Container';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import CustomText from '@/components/atoms/CustomText';
import { emailSchema, type EmailFormValues } from '@/utils/schemas';

interface LoginScreenProps {
  onSubmit: (email: string) => void;
  isLoading?: boolean;
  serverError?: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onSubmit, isLoading = false, serverError }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const handleFormSubmit = (data: EmailFormValues) => {
    onSubmit(data.email);
  };

  return (
    <Container>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Header Section - Top Left */}
          <View className="pb-12 pt-8">
            <Text className="mb-2 font-head text-4xl text-foreground">peculium</Text>
            <CustomText variant="p" className="text-muted-foreground">
              Main Character Energy!
            </CustomText>
          </View>

          {/* Login Form - Vertically Centered */}
          <View className="flex-1 justify-center">
            <View className="gap-6">
              <Text className="font-head text-3xl text-foreground">Login</Text>

              <View>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="Email"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      isInvalid={!!errors.email}
                    />
                  )}
                />
                {errors.email && (
                  <CustomText variant="p" className="mt-2 text-destructive">
                    {errors.email.message}
                  </CustomText>
                )}
              </View>

              {serverError && (
                <CustomText variant="p" className="-mt-2 text-destructive">
                  {serverError}
                </CustomText>
              )}

              <Button
                onPress={handleSubmit(handleFormSubmit)}
                variant="default"
                size="lg"
                disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Continue'}
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
};

export default memo(LoginScreen);
