import React, { memo, useCallback } from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';

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
        <MaterialIcons name="filter-list" size={20} color="black" />
      </Button>
    </View>
  );
};

export default memo(TransactionSearchBar);
