import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import CustomText from '@/components/atoms/CustomText';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { EDIT_MONTHLY_BUDGET_SHEET_ID } from '@/components/bottomsheets/EditMonthlyBudgetSheet';
import { cn } from '@/utils/cn';

const AnimatedView = Animated.View;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SHADOW_SIZE = 4;

export interface MonthlySpendBudgetCardProps {
  currentSpend: number;
  totalBudget: number; // 0 = not set yet
}

type BudgetState = 'SAFE TO SPEND' | 'TIGHT' | 'STOP NOW';

const MonthlySpendBudgetCard: React.FC<MonthlySpendBudgetCardProps> = ({
  currentSpend,
  totalBudget,
}) => {
  const { open } = useBottomSheet(EDIT_MONTHLY_BUDGET_SHEET_ID);
  const progress = useSharedValue(0);
  const translate = useSharedValue(0);

  // Calculate state and colors
  const { spendPercentage, state, headerBg, badgeBg, fillColor } = useMemo(() => {
    if (totalBudget === 0) {
      return {
        spendPercentage: 0,
        state: 'SAFE TO SPEND' as BudgetState,
        headerBg: 'bg-muted/20',
        badgeBg: 'bg-muted',
        fillColor: '#aeaeae',
      };
    }

    const percentage = Math.min((currentSpend / totalBudget) * 100, 100);

    if (percentage >= 90) {
      return {
        spendPercentage: percentage,
        state: 'STOP NOW' as BudgetState,
        headerBg: 'bg-destructive/10',
        badgeBg: 'bg-destructive',
        fillColor: '#e63946',
      };
    } else if (percentage >= 75) {
      return {
        spendPercentage: percentage,
        state: 'TIGHT' as BudgetState,
        headerBg: 'bg-accent',
        badgeBg: 'bg-primary',
        fillColor: '#ffdb33',
      };
    } else {
      return {
        spendPercentage: percentage,
        state: 'SAFE TO SPEND' as BudgetState,
        headerBg: 'bg-safe-muted',
        badgeBg: 'bg-safe',
        fillColor: '#4ade80',
      };
    }
  }, [currentSpend, totalBudget]);

  // Animate progress bar
  useEffect(() => {
    progress.value = withTiming(spendPercentage, { duration: 600 });
  }, [spendPercentage, progress]);

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
    backgroundColor: fillColor,
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translate.value * SHADOW_SIZE },
      { translateY: translate.value * SHADOW_SIZE },
    ],
    boxShadow: `${SHADOW_SIZE - translate.value * SHADOW_SIZE}px ${SHADOW_SIZE - translate.value * SHADOW_SIZE}px 0px black`,
  }));

  const handlePressIn = useCallback(() => {
    translate.value = withTiming(1, { duration: 80 });
  }, [translate]);

  const handlePressOut = useCallback(() => {
    translate.value = withTiming(0, { duration: 80 });
  }, [translate]);

  const handlePress = useCallback(() => {
    open({ currentAmount: totalBudget });
  }, [open, totalBudget]);

  const formattedSpend = useMemo(
    () => currentSpend.toLocaleString('en-IN'),
    [currentSpend],
  );

  const formattedBudget = useMemo(
    () => totalBudget.toLocaleString('en-IN'),
    [totalBudget],
  );

  // Empty state - no budget set
  if (totalBudget === 0) {
    return (
      <AnimatedPressable 
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={cardAnimatedStyle}
      >
        <View className="bg-white border-2 border-black">
          {/* Header */}
          <View className={cn('border-b-2 border-black px-4 py-3', headerBg)}>
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="account-balance-wallet" size={20} color="#000" />
              <CustomText variant="label" className="text-xs tracking-widest">
                MONTHLY BUDGET
              </CustomText>
            </View>
          </View>

          {/* Empty State Body */}
          <View className="px-4 py-8 items-center">
            <MaterialIcons name="trending-up" size={48} color="#aeaeae" />
            <CustomText variant="h4" className="mt-4 mb-2">
              No Budget Set
            </CustomText>
            <CustomText variant="muted" className="text-center text-sm">
              Tap to set your monthly spending limit
            </CustomText>
          </View>
        </View>
      </AnimatedPressable>
    );
  }

  // Normal state - budget is set
  return (
    <AnimatedPressable 
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={cardAnimatedStyle}
    >
      <View className="bg-white border-2 border-black">
        {/* Header Row */}
        <View className={cn('border-b-2 border-black px-4 py-3 flex-row justify-between items-center', headerBg)}>
          <View className="flex-row items-center gap-2">
            <MaterialIcons name="account-balance-wallet" size={20} color="#000" />
            <CustomText variant="label" className="text-xs tracking-widest">
              MONTHLY BUDGET
            </CustomText>
          </View>
          <View
            className={cn('border-2 border-black px-3 py-1', badgeBg)}
            style={{ boxShadow: '1px 1px 0 0 #000' }}
          >
            <CustomText variant="label" className="text-xs tracking-wider">
              {state}
            </CustomText>
          </View>
        </View>

        {/* Body */}
        <View className="px-4 py-5">
          {/* Amounts */}
          <View className="flex-row items-baseline mb-4">
            <CustomText variant="h2">₹{formattedSpend}</CustomText>
            <CustomText variant="p" className="text-muted-foreground ml-2">
              / ₹{formattedBudget}
            </CustomText>
          </View>

          {/* Progress Bar */}
          <View className="h-8 border-2 border-black bg-muted/20 overflow-hidden">
            <AnimatedView
              className="h-full border-r-2 border-black"
              style={progressAnimatedStyle}
            />
          </View>

          {/* Percentage Text */}
          <View className="flex-row justify-between mt-2">
            <CustomText variant="muted" className="text-xs">
              {spendPercentage.toFixed(1)}% used
            </CustomText>
            <CustomText variant="muted" className="text-xs">
              ₹{(totalBudget - currentSpend).toLocaleString('en-IN')} left
            </CustomText>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
};

export default memo(MonthlySpendBudgetCard);
