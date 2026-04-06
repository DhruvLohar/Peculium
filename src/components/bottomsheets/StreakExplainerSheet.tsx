import React, { memo } from 'react';
import { ScrollView, View } from 'react-native';
import CustomText from '@/components/atoms/CustomText';
import Button from '@/components/atoms/Button';
import FixedBottomSheet from '@/components/atoms/FixedBottomSheet';
import FireIcon from '@/components/icons/FireIcon';
import { useBottomSheet } from '@/hooks/useBottomSheet';

export const STREAK_EXPLAINER_SHEET_ID = 'streak-explainer';

const StreakExplainerContent: React.FC = () => {
  const { close } = useBottomSheet(STREAK_EXPLAINER_SHEET_ID);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24 }}>
      {/* Header with Icon */}
      <View className="items-center mb-6">
        <View className="mb-4">
          <FireIcon size={64} color="#e63946" />
        </View>
        <CustomText variant="h3" className="text-center mb-2">
          Daily Streak
        </CustomText>
        <CustomText variant="muted" className="text-center text-sm">
          Build consistency by tracking your financial activity
        </CustomText>
      </View>

      {/* How it works */}
      <View className="bg-primary/20 border-2 border-border p-4 mb-4">
        <CustomText variant="h4" className="mb-3">
          How It Works
        </CustomText>

        <View className="gap-3">
          <View className="flex-row gap-3">
            <View className="w-6 h-6 border-2 border-border bg-primary items-center justify-center">
              <CustomText variant="label" className="text-xs">1</CustomText>
            </View>
            <View className="flex-1">
              <CustomText variant="p" className="text-sm">
                Add at least one transaction each day
              </CustomText>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="w-6 h-6 border-2 border-border bg-primary items-center justify-center">
              <CustomText variant="label" className="text-xs">2</CustomText>
            </View>
            <View className="flex-1">
              <CustomText variant="p" className="text-sm">
                Your streak increases by 1 each consecutive day
              </CustomText>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="w-6 h-6 border-2 border-border bg-primary items-center justify-center">
              <CustomText variant="label" className="text-xs">3</CustomText>
            </View>
            <View className="flex-1">
              <CustomText variant="p" className="text-sm">
                Miss a day and your streak resets to 0
              </CustomText>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="w-6 h-6 border-2 border-border bg-primary items-center justify-center">
              <CustomText variant="label" className="text-xs">4</CustomText>
            </View>
            <View className="flex-1">
              <CustomText variant="p" className="text-sm">
                Your longest streak is saved as your best record
              </CustomText>
            </View>
          </View>
        </View>
      </View>

      {/* Benefit */}
      <View className="border-2 border-border p-4 mb-6">
        <View className="flex-row items-center gap-2 mb-2">
          <FireIcon size={16} color="#e63946" />
          <CustomText variant="h4">Why Track Daily?</CustomText>
        </View>
        <CustomText variant="p" className="text-sm">
          Consistent tracking builds better financial awareness. The more you engage with your money, the better you understand your spending patterns.
        </CustomText>
      </View>

      {/* Action */}
      <Button onPress={close} variant="default" size="lg">
        Got It!
      </Button>
    </ScrollView>
  );
};

const StreakExplainerSheet = memo(() => (
  <FixedBottomSheet id={STREAK_EXPLAINER_SHEET_ID} maxHeight={0.65}>
    {() => <StreakExplainerContent />}
  </FixedBottomSheet>
));

export default StreakExplainerSheet;
