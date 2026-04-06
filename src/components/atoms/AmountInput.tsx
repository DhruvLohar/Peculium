import React, { memo, useCallback, useMemo } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import CustomText from './CustomText';
import { getThemeColors } from '@/utils/themeColors';

interface AmountInputProps extends Pick<TextInputProps, 'onBlur' | 'onFocus'> {
  value: string;
  onChangeText: (text: string) => void;
  isInvalid?: boolean;
}

const MAX_VALUE = 100000;

const formatWithCommas = (num: string): string => {
  const parts = num.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

const removeCommas = (str: string): string => str.replace(/,/g, '');

const AmountInput: React.FC<AmountInputProps> = ({ value, onChangeText, onBlur, onFocus, isInvalid = false }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);

  const borderWidth = useSharedValue(1);

  const displayValue = useMemo(() => {
    const cleanValue = removeCommas(value);
    if (!cleanValue || cleanValue === '') return '';
    return formatWithCommas(cleanValue);
  }, [value]);

  const handleChangeText = useCallback(
    (text: string) => {
      const cleanText = removeCommas(text);
      if (cleanText === '') { onChangeText(''); return; }
      if (!/^\d*\.?\d*$/.test(cleanText)) return;
      const parts = cleanText.split('.');
      if (parts.length > 2) return;
      if (parts[1] && parts[1].length > 2) return;
      const numValue = parseFloat(cleanText);
      if (numValue > MAX_VALUE) return;
      onChangeText(cleanText);
    },
    [onChangeText],
  );

  const handleFocus = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
      borderWidth.value = withTiming(2, { duration: 150 });
      onFocus?.(e);
    },
    [onFocus, borderWidth],
  );

  const handleBlur = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
      borderWidth.value = withTiming(1, { duration: 150 });
      onBlur?.(e);
    },
    [onBlur, borderWidth],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    borderBottomWidth: borderWidth.value,
    borderBottomColor: isInvalid ? colors.destructive : colors.border,
  }));

  return (
    <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }, animatedStyle]}>
      <MaterialIcons
        name="currency-rupee"
        size={24}
        color={isInvalid ? colors.destructive : colors.foreground}
        style={{ marginRight: 8, transform: [{ translateY: 6 }] }}
      />
      <TextInput
        value={displayValue}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        keyboardType="decimal-pad"
        placeholder="0.00"
        placeholderTextColor={colors.muted}
        style={{ flex: 1, fontSize: 44, fontWeight: '700', color: isInvalid ? colors.destructive : colors.foreground }}
      />
    </Animated.View>
  );
};

export default memo(AmountInput);
