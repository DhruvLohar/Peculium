import React, { memo, useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import CustomText from '@/components/atoms/CustomText';

interface PendingReviewBannerProps {
  count: number;
  onPress: () => void;
}

const PendingReviewBanner: React.FC<PendingReviewBannerProps> = ({ count, onPress }) => {
  const title = useMemo(
    () => `${count} transaction${count === 1 ? '' : 's'} need${count === 1 ? 's' : ''} a category`,
    [count]
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="mb-6 mr-1 flex-row items-center border-2 border-border bg-primary p-4 shadow">
      <View className="mr-3 h-10 w-10 items-center justify-center border-2 border-border bg-card">
        <MaterialIcons name="sms" size={20} color="#000" />
      </View>
      <View className="flex-1">
        <CustomText className="font-sans-bold text-primary-foreground">{title}</CustomText>
        <CustomText className="mt-0.5 text-xs text-primary-foreground">
          Captured from bank SMS · tap to review
        </CustomText>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#000" />
    </TouchableOpacity>
  );
};

export default memo(PendingReviewBanner);
