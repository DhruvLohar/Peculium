import React, { memo, useCallback } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { cn } from '@/utils/cn';

export interface InputProps extends TextInputProps {
  className?: string;
  isInvalid?: boolean;
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const Input: React.FC<InputProps> = ({
  placeholder = 'Enter text',
  className,
  isInvalid = false,
  onChangeText,
  onFocus,
  onBlur,
  ...props
}) => {
  const shadowOffset = useSharedValue(4);

  const handleFocus = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
      shadowOffset.value = withTiming(0, { duration: 150 });
      onFocus?.(e);
    },
    [onFocus, shadowOffset],
  );

  const handleBlur = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
      shadowOffset.value = withTiming(4, { duration: 150 });
      onBlur?.(e);
    },
    [onBlur, shadowOffset],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    boxShadow: `${shadowOffset.value}px ${shadowOffset.value}px 0px black`,
  }));

  const inputClass = cn(
    'w-full border-2 border-black px-4 py-2 font-sans text-foreground bg-background',
    isInvalid && 'border-destructive text-destructive',
    className,
  );

  return (
    <AnimatedTextInput
      placeholder={placeholder}
      placeholderTextColor="#aeaeae"
      className={inputClass}
      style={animatedStyle}
      onChangeText={onChangeText}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  );
};

export default memo(Input);
