import React, { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import CustomText from '@/components/atoms/CustomText';
import Button from '@/components/atoms/Button';
import FireIcon from '@/components/icons/FireIcon';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { STREAK_EXPLAINER_SHEET_ID } from '@/components/bottomsheets/StreakExplainerSheet';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SHADOW_SIZE = 4;

export interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
}

const StreakCard: React.FC<StreakCardProps> = ({ currentStreak, longestStreak }) => {
  const { open } = useBottomSheet(STREAK_EXPLAINER_SHEET_ID);

  const handlePress = useCallback(() => {
    open();
  }, [open]);

  return (
    <Button onPress={handlePress} className="ml-auto mr-1">
      <FireIcon size={18} color="#e63946" />
      <CustomText variant="h4" className="ml-2">
        {currentStreak}
      </CustomText>
    </Button>
  );
};

export default memo(StreakCard);
