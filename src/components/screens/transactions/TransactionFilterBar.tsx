import React, { memo, useCallback } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import CustomText from '@/components/atoms/CustomText';

export type FilterOption = 'ALL' | 'INCOME' | 'EXPENSE' | 'THIS_WEEK';

const FILTERS: { label: string; value: FilterOption }[] = [
  { label: 'ALL', value: 'ALL' },
  { label: 'INCOME', value: 'INCOME' },
  { label: 'EXPENSE', value: 'EXPENSE' },
  { label: 'THIS WEEK', value: 'THIS_WEEK' },
];

interface TransactionFilterBarProps {
  active: FilterOption;
  onChange: (filter: FilterOption) => void;
}

interface FilterTabProps {
  label: string;
  value: FilterOption;
  isActive: boolean;
  onPress: (value: FilterOption) => void;
}

const FilterTab: React.FC<FilterTabProps> = memo(({ label, value, isActive, onPress }) => {
  const handlePress = useCallback(() => onPress(value), [onPress, value]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className={`mr-2 border-2 px-3 py-1 ${
        isActive ? 'border-primary bg-primary' : 'border-foreground bg-background'
      }`}>
      <CustomText variant="label" darkInvert={isActive}>
        {label}
      </CustomText>
    </TouchableOpacity>
  );
});

const TransactionFilterBar: React.FC<TransactionFilterBarProps> = ({ active, onChange }) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row">
        {FILTERS.map((f) => (
          <FilterTab
            key={f.value}
            label={f.label}
            value={f.value}
            isActive={active === f.value}
            onPress={onChange}
          />
        ))}
      </View>
    </ScrollView>
  );
};

export default memo(TransactionFilterBar);
