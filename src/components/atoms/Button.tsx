import React, { memo, useCallback, useMemo } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SHADOW_SIZE: Record<string, number> = {
  sm: 3,
  md: 4,
  lg: 5,
  icon: 3,
};

export const buttonVariants = cva(
  'flex-row justify-center items-center border-2 border-black',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-secondary',
        outline: 'bg-transparent',
        link: 'bg-transparent border-0',
        ghost: 'bg-transparent border-0',
      },
      size: {
        sm: 'px-3 py-1',
        md: 'px-4 py-2',
        lg: 'px-6 py-3',
        icon: 'p-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

const buttonTextVariants = cva('font-head font-medium', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      outline: 'text-foreground',
      link: 'text-foreground underline',
      ghost: 'text-foreground',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      icon: 'text-base',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'default',
  size = 'md',
  disabled = false,
  className,
  textClassName,
  onPress,
}) => {
  const offset = SHADOW_SIZE[size ?? 'md'];
  const translate = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    translate.value = withTiming(1, { duration: 80 });
  }, [translate]);

  const handlePressOut = useCallback(() => {
    translate.value = withTiming(0, { duration: 80 });
  }, [translate]);

  const hasShadow = variant !== 'link' && variant !== 'ghost';

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translate.value * offset },
      { translateY: translate.value * offset },
    ],
    boxShadow: hasShadow
      ? `${offset - translate.value * offset}px ${offset - translate.value * offset}px 0px black`
      : undefined,
  }));

  const containerClass = useMemo(
    () => cn(buttonVariants({ variant, size }), disabled && 'opacity-60', className),
    [variant, size, disabled, className],
  );

  const textClass = useMemo(
    () => cn(buttonTextVariants({ variant, size }), textClassName),
    [variant, size, textClassName],
  );

  const content = useMemo(
    () =>
      typeof children === 'string' ? (
        <Text className={textClass}>{children}</Text>
      ) : (
        children
      ),
    [children, textClass],
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
      {content}
    </AnimatedPressable>
  );
};

export default memo(Button);
export { buttonTextVariants };
