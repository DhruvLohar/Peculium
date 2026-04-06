import React, { memo, useCallback, useMemo } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { cva, type VariantProps } from 'class-variance-authority';
import { useColorScheme } from 'nativewind';
import { cn } from '@/utils/cn';
import { getThemeColors } from '@/utils/themeColors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SHADOW_SIZE = 5;

const fabVariants = cva(
  'absolute bottom-8 right-6 items-center justify-center border-2 border-border rounded-full',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-secondary',
        accent: 'bg-accent',
      },
      size: {
        sm: 'w-12 h-12',
        md: 'w-14 h-14',
        lg: 'w-16 h-16',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export interface FloatingActionButtonProps extends VariantProps<typeof fabVariants> {
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  children,
  variant = 'default',
  size = 'md',
  disabled = false,
  className,
  onPress,
}) => {
  const { colorScheme } = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const translate = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    translate.value = withTiming(1, { duration: 80 });
  }, [translate]);

  const handlePressOut = useCallback(() => {
    translate.value = withTiming(0, { duration: 80 });
  }, [translate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translate.value * SHADOW_SIZE },
      { translateY: translate.value * SHADOW_SIZE },
    ],
    boxShadow: `${SHADOW_SIZE - translate.value * SHADOW_SIZE}px ${SHADOW_SIZE - translate.value * SHADOW_SIZE}px 0px ${colors.border}`,
  }));

  const containerClass = useMemo(
    () => cn(fabVariants({ variant, size }), disabled && 'opacity-60', className),
    [variant, size, disabled, className],
  );

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      className={containerClass}
      style={animatedStyle}
    >
      {children}
    </AnimatedPressable>
  );
};

export default memo(FloatingActionButton);
