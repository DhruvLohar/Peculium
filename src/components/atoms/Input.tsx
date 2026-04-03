import React, { memo, useCallback, useMemo } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '../../utils/cn';

export interface InputProps extends TextInputProps {
  className?: string;
  isInvalid?: boolean;
}

const Input: React.FC<InputProps> = ({
  placeholder = 'Enter text',
  className,
  isInvalid = false,
  onChangeText,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const handleFocus = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
      setIsFocused(true);
      onFocus?.(e);
    },
    [onFocus],
  );

  const handleBlur = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
      setIsFocused(false);
      onBlur?.(e);
    },
    [onBlur],
  );

  const inputClass = useMemo(
    () =>
      cn(
        'w-full border-2 border-black py-2 font-sans text-foreground bg-background',
        isInvalid && 'border-destructive text-destructive',
        className,
      ),
    [isInvalid, className],
  );

  const shadowStyle = useMemo(
    () => ({
      boxShadow: isFocused ? '0px 0px 0px black' : '4px 4px 0px black',
    }),
    [isFocused],
  );

  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor="#aeaeae"
      className={inputClass}
      style={{
        ...shadowStyle,
        paddingLeft: 16,
        paddingRight: 16,
      }}
      onChangeText={onChangeText}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  );
};

export default memo(Input);
