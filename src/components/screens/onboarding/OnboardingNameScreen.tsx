import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Container } from '@/components/Container';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import CustomText from '@/components/atoms/CustomText';
import { displayNameSchema, type DisplayNameFormValues } from '@/utils/schemas';

interface OnboardingNameScreenProps {
  onContinue: (name: string) => void;
  isLoading?: boolean;
  serverError?: string;
}

const OnboardingNameScreen: React.FC<OnboardingNameScreenProps> = ({
  onContinue,
  isLoading = false,
  serverError,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DisplayNameFormValues>({
    resolver: zodResolver(displayNameSchema),
    defaultValues: { name: '' },
  });

  const handleFormSubmit = (data: DisplayNameFormValues) => {
    onContinue(data.name);
  };

  return (
    <Container>
      {/* Header Section - Top Left */}
      <View className="pb-12 pt-8">
        <Text className="mb-2 font-head text-4xl text-foreground">peculium</Text>
        <CustomText variant="p" className="text-muted-foreground">
          Main Character Energy!
        </CustomText>
      </View>

      {/* Name Form - Vertically Centered */}
      <View className="flex-1 justify-center">
        <View className="gap-6">
          <View>
            <Text className="mb-2 font-head text-3xl text-foreground">
              What should we call you?
            </Text>
            <CustomText variant="p" className="text-muted-foreground">
              Let&apos;s personalize your experience
            </CustomText>
          </View>

          <View>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="Enter your name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="words"
                  autoComplete="name"
                  isInvalid={!!errors.name}
                />
              )}
            />
            {errors.name && (
              <CustomText variant="p" className="mt-2 text-destructive">
                {errors.name.message}
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
            {isLoading ? 'Setting up...' : 'Continue'}
          </Button>
        </View>
      </View>
    </Container>
  );
};

export default memo(OnboardingNameScreen);
