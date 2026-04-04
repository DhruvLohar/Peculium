import React, { memo } from 'react';
import { View, Text } from 'react-native';
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
      {/* Header Section - Top Left */}
      <View className="pt-8 pb-12">
        <Text className="font-head text-4xl mb-2 text-foreground">
          peculium
        </Text>
        <CustomText variant="p" className="text-muted-foreground">
          Main Character Energy!
        </CustomText>
      </View>

      {/* Login Form - Vertically Centered */}
      <View className="flex-1 justify-center">
        <View className="gap-6">
          <Text className="font-head text-3xl text-foreground">
            Login
          </Text>

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
              <CustomText variant="p" className="text-destructive mt-2">
                {errors.email.message}
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
            {isLoading ? 'Sending...' : 'Continue'}
          </Button>
        </View>
      </View>
    </Container>
  );
};

export default memo(LoginScreen);
