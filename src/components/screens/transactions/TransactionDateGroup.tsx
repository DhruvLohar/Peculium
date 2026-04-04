import React, { memo, useCallback } from 'react';
import { View } from 'react-native';
import CustomText from '@/components/atoms/CustomText';
import TransactionCard from './TransactionCard';
import type { Database } from '@/utils/database.types';

type TransactionRow = Database['public']['Tables']['transactions']['Row'];

interface TransactionDateGroupProps {
  label: string;
  transactions: TransactionRow[];
  onCardPress?: (id: string) => void;
}

const TransactionDateGroup: React.FC<TransactionDateGroupProps> = ({
  label,
  transactions,
  onCardPress,
}) => {
  const handleCardPress = useCallback(
    (id: string) => {
      onCardPress?.(id);
    },
    [onCardPress],
  );

  return (
    <View className="mb-2">
      <CustomText variant="h6" className="mb-3">
        {label}
      </CustomText>
      {transactions.map((t) => (
        <TransactionCard key={t.id} transaction={t} onPress={handleCardPress} />
      ))}
    </View>
  );
};

export default memo(TransactionDateGroup);
