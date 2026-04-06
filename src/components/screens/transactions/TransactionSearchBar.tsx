import React, { memo, useCallback } from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import { getThemeColors } from '@/utils/themeColors';

interface TransactionSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress?: () => void;
}

const TransactionSearchBar: React.FC<TransactionSearchBarProps> = ({
  value,
  onChangeText,
  onFilterPress,
}) => {
  const { colorScheme } = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');

  const handleFilterPress = useCallback(() => {
    onFilterPress?.();
  }, [onFilterPress]);

  return (
    <View className="flex-row items-center gap-2">
      <Input
        className="flex-1"
        placeholder="Search Transactions..."
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        returnKeyType="search"
      />
      <Button size="icon" variant="outline" onPress={handleFilterPress}>
        <MaterialIcons name="filter-list" size={20} color={colors.foreground} />
      </Button>
    </View>
  );
};

export default memo(TransactionSearchBar);
