import React, { memo, useState, useEffect } from 'react';
import { View } from 'react-native';
import ProgressBar from './ProgressBar';
import CustomText from './CustomText';
import Button from './Button';

/**
 * ProgressBar Demo Component
 * Shows various usage examples of the ProgressBar component
 */
const ProgressBarDemo: React.FC = () => {
  const [dynamicValue, setDynamicValue] = useState(0);

  // Simulate loading progress
  useEffect(() => {
    const interval = setInterval(() => {
      setDynamicValue((prev) => {
        if (prev >= 100) return 0;
        return prev + 10;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <View className="gap-6 p-4">
      {/* Basic Examples */}
      <View className="gap-2">
        <CustomText variant="h4">Basic Progress</CustomText>
        <ProgressBar value={75} />
      </View>

      {/* Sizes */}
      <View className="gap-2">
        <CustomText variant="h4">Different Sizes</CustomText>
        <View className="gap-2">
          <CustomText variant="label" className="text-xs">
            Small (sm)
          </CustomText>
          <ProgressBar value={60} size="sm" />

          <CustomText variant="label" className="text-xs mt-2">
            Medium (md) - Default
          </CustomText>
          <ProgressBar value={60} size="md" />

          <CustomText variant="label" className="text-xs mt-2">
            Large (lg)
          </CustomText>
          <ProgressBar value={60} size="lg" />
        </View>
      </View>

      {/* Colors */}
      <View className="gap-2">
        <CustomText variant="h4">Different Colors</CustomText>
        <View className="gap-2">
          <CustomText variant="label" className="text-xs">
            Primary (Yellow)
          </CustomText>
          <ProgressBar value={80} color="primary" />

          <CustomText variant="label" className="text-xs mt-2">
            Secondary (Black)
          </CustomText>
          <ProgressBar value={65} color="secondary" />

          <CustomText variant="label" className="text-xs mt-2">
            Destructive (Red)
          </CustomText>
          <ProgressBar value={90} color="destructive" />

          <CustomText variant="label" className="text-xs mt-2">
            Accent (Light Yellow)
          </CustomText>
          <ProgressBar value={45} color="accent" />
        </View>
      </View>

      {/* Animation Types */}
      <View className="gap-2">
        <CustomText variant="h4">Animation Types</CustomText>
        <View className="gap-2">
          <CustomText variant="label" className="text-xs">
            Timing Animation
          </CustomText>
          <ProgressBar value={dynamicValue} animationType="timing" />

          <CustomText variant="label" className="text-xs mt-2">
            Spring Animation
          </CustomText>
          <ProgressBar value={dynamicValue} animationType="spring" />
        </View>
      </View>

      {/* Budget Example */}
      <View className="gap-2">
        <CustomText variant="h4">Budget Progress</CustomText>
        <View className="bg-white border-2 border-black p-4 gap-2">
          <View className="flex-row justify-between">
            <CustomText variant="label">Food Budget</CustomText>
            <CustomText variant="muted" className="text-xs">
              ₹5,000 / ₹8,000
            </CustomText>
          </View>
          <ProgressBar value={5000} max={8000} color="primary" />
          <CustomText variant="muted" className="text-xs">
            63% of budget used
          </CustomText>
        </View>
      </View>

      {/* Over Budget Example */}
      <View className="gap-2">
        <CustomText variant="h4">Over Budget Warning</CustomText>
        <View className="bg-white border-2 border-black p-4 gap-2">
          <View className="flex-row justify-between">
            <CustomText variant="label">Travel Budget</CustomText>
            <CustomText variant="muted" className="text-xs">
              ₹3,500 / ₹2,000
            </CustomText>
          </View>
          <ProgressBar value={3500} max={2000} color="destructive" />
          <CustomText className="text-xs text-destructive">
            ⚠️ 175% - Over budget!
          </CustomText>
        </View>
      </View>

      {/* Savings Goal */}
      <View className="gap-2">
        <CustomText variant="h4">Savings Goal</CustomText>
        <View className="bg-accent border-2 border-black p-4 gap-2">
          <View className="flex-row justify-between">
            <CustomText variant="label">Dream Vacation</CustomText>
            <CustomText variant="muted" className="text-xs">
              45%
            </CustomText>
          </View>
          <ProgressBar
            value={45000}
            max={100000}
            color="secondary"
            size="lg"
            animationType="spring"
          />
          <CustomText variant="muted" className="text-xs">
            ₹45,000 saved of ₹1,00,000 goal
          </CustomText>
        </View>
      </View>

      {/* Interactive Example */}
      <View className="gap-2">
        <CustomText variant="h4">Interactive</CustomText>
        <View className="bg-white border-2 border-black p-4 gap-3">
          <View className="flex-row justify-between">
            <CustomText variant="label">Progress: {dynamicValue}%</CustomText>
            <Button
              size="sm"
              variant="outline"
              onPress={() => setDynamicValue(0)}
            >
              Reset
            </Button>
          </View>
          <ProgressBar value={dynamicValue} animationType="spring" />
        </View>
      </View>
    </View>
  );
};

export default memo(ProgressBarDemo);
