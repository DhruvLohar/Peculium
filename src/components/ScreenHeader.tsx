import React, { memo, useCallback } from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CustomText from '@/components/atoms/CustomText';
import Button from '@/components/atoms/Button';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  onBack,
  showBackButton = true,
}) => {
  const router = useRouter();

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  }, [onBack, router]);

  return (
    <View className="pt-8 pb-6">
      {/* Back Button */}
      {showBackButton && (
        <Button size="icon" variant="outline" onPress={handleBack} className="mb-4 self-start">
          <MaterialIcons name="arrow-back" size={12} color="#000000" />
        </Button>
      )}

      {/* Title & Subtitle */}
      <View className="items-start">
        <CustomText variant="h2" className="mb-1">
          {title}
        </CustomText>
        {subtitle && (
          <CustomText variant="muted" className="text-muted-foreground">
            {subtitle}
          </CustomText>
        )}
      </View>
    </View>
  );
};

export default memo(ScreenHeader);
