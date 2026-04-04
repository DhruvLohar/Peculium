import React, { memo, useCallback, useMemo } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import CustomText from './CustomText';

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

const removeCommas = (str: string): string => {
  return str.replace(/,/g, '');
};

const AmountInput: React.FC<AmountInputProps> = ({ value, onChangeText, onBlur, onFocus, isInvalid = false }) => {
  const borderWidth = useSharedValue(1);

  // Memoize the displayed value (with commas)
  const displayValue = useMemo(() => {
    const cleanValue = removeCommas(value);
    if (!cleanValue || cleanValue === '') return '';
    return formatWithCommas(cleanValue);
  }, [value]);

  const handleChangeText = useCallback(
    (text: string) => {
      const cleanText = removeCommas(text);
      
      // Allow empty string
      if (cleanText === '') {
        onChangeText('');
        return;
      }

      // Only allow numbers and one decimal point
      if (!/^\d*\.?\d*$/.test(cleanText)) {
        return;
      }

      // Restrict to 2 decimal places
      const parts = cleanText.split('.');
      if (parts.length > 2) {
        return;
      }
      if (parts[1] && parts[1].length > 2) {
        return;
      }

      // Check max value
      const numValue = parseFloat(cleanText);
      if (numValue > MAX_VALUE) {
        return;
      }

      // Pass clean value (without commas) to parent for validation
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
    borderBottomColor: isInvalid ? '#e63946' : '#000',
  }));

  return (
    <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }, animatedStyle]}>
      <MaterialIcons 
        name="currency-rupee"
        size={24}
        color="black"
        style={{ marginRight: 8, transform: [{ translateY: 6 }] }}
      />
      <TextInput
        value={displayValue}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        keyboardType="decimal-pad"
        placeholder="0.00"
        placeholderTextColor="#aeaeae"
        style={{ flex: 1, fontSize: 44, fontWeight: '700', color: isInvalid ? '#e63946' : '#000' }}
      />
    </Animated.View>
  );
};

export default memo(AmountInput);
