import React, { memo, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const loaderVariants = cva('flex-row gap-1', {
  variants: {
    variant: {
      default: '',
      secondary: '',
      outline: '',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

const dotBgVariants: Record<NonNullable<VariantProps<typeof loaderVariants>['variant']>, string> = {
  default: 'bg-primary border-border',
  secondary: 'bg-secondary border-border',
  outline: 'bg-transparent border-border',
};

const dotSizeVariants: Record<NonNullable<VariantProps<typeof loaderVariants>['size']>, string> = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

interface LoaderDotProps {
  delay: number;
  duration: number;
  dotClass: string;
}

const LoaderDot: React.FC<LoaderDotProps> = memo(({ delay, duration, dotClass }) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: duration * 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: duration * 500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      ),
    );
  }, [delay, duration, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View className={dotClass} style={animatedStyle} />;
});

LoaderDot.displayName = 'LoaderDot';

export interface LoaderProps extends VariantProps<typeof loaderVariants> {
  count?: number;
  duration?: number;
  delayStep?: number;
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({
  variant = 'default',
  size = 'md',
  count = 3,
  duration = 0.5,
  delayStep = 100,
  className,
}) => {
  const containerClass = useMemo(
    () => cn(loaderVariants({ variant, size }), className),
    [variant, size, className],
  );

  const dotClass = useMemo(
    () =>
      cn(
        'border-2',
        dotBgVariants[variant ?? 'default'],
        dotSizeVariants[size ?? 'md'],
      ),
    [variant, size],
  );

  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => (
        <LoaderDot key={i} delay={i * delayStep} duration={duration} dotClass={dotClass} />
      )),
    [count, delayStep, duration, dotClass],
  );

  return (
    <View className={containerClass} accessibilityLabel="Loading...">
      {dots}
    </View>
  );
};

export default memo(Loader);
