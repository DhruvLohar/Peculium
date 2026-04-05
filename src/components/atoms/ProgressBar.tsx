import React, { memo, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const AnimatedView = Animated.View;

// ─── Variants ────────────────────────────────────────────────────────────────

const progressVariants = cva('relative overflow-hidden border-2 border-black', {
  variants: {
    variant: {
      default: 'bg-background',
      muted: 'bg-muted/20',
    },
    size: {
      sm: 'h-2',
      md: 'h-4',
      lg: 'h-6',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

const progressIndicatorVariants = cva('h-full', {
  variants: {
    color: {
      primary: 'bg-primary',
      secondary: 'bg-secondary',
      destructive: 'bg-destructive',
      accent: 'bg-accent',
    },
  },
  defaultVariants: {
    color: 'primary',
  },
});

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProgressBarProps extends VariantProps<typeof progressVariants> {
  value?: number; // 0-100
  max?: number; // Default 100
  color?: VariantProps<typeof progressIndicatorVariants>['color'];
  animated?: boolean; // Default true
  animationType?: 'timing' | 'spring'; // Default 'timing'
  className?: string;
  indicatorClassName?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

const ProgressBar: React.FC<ProgressBarProps> = ({
  value = 0,
  max = 100,
  variant = 'default',
  size = 'md',
  color = 'primary',
  animated = true,
  animationType = 'timing',
  className,
  indicatorClassName,
}) => {
  const progress = useSharedValue(0);

  // Calculate percentage (0-100)
  const percentage = useMemo(() => {
    const clampedValue = Math.max(0, Math.min(value, max));
    return (clampedValue / max) * 100;
  }, [value, max]);

  // Animate progress when value changes
  useEffect(() => {
    if (animated) {
      if (animationType === 'spring') {
        progress.value = withSpring(percentage, {
          damping: 15,
          stiffness: 100,
        });
      } else {
        progress.value = withTiming(percentage, {
          duration: 300,
        });
      }
    } else {
      progress.value = percentage;
    }
  }, [percentage, animated, animationType, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const containerClass = useMemo(
    () => cn(progressVariants({ variant, size }), className),
    [variant, size, className],
  );

  const indicatorClass = useMemo(
    () => cn(progressIndicatorVariants({ color }), indicatorClassName),
    [color, indicatorClassName],
  );

  return (
    <View className={containerClass}>
      <AnimatedView className={indicatorClass} style={animatedStyle} />
    </View>
  );
};

export default memo(ProgressBar);
