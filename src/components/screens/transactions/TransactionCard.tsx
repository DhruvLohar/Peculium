import React, { memo, useMemo, useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import CustomText from '@/components/atoms/CustomText';
import { CATEGORY_CONFIG } from '@/utils/categoryConfig';
import type { Database } from '@/utils/database.types';

type TransactionRow = Database['public']['Tables']['transactions']['Row'];
type TransactionCategory = Database['public']['Enums']['transaction_category'];

interface TransactionCardProps {
  transaction: TransactionRow;
  onPress?: (id: string) => void;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, onPress }) => {
  const handlePress = useCallback(() => {
    onPress?.(transaction.id);
  }, [onPress, transaction.id]);

  const config = useMemo(
    () => CATEGORY_CONFIG[transaction.category as TransactionCategory] ?? CATEGORY_CONFIG.Other,
    [transaction.category],
  );

  const formattedTime = useMemo(() => {
    const date = new Date(transaction.transaction_date);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }, [transaction.transaction_date]);

  const formattedAmount = useMemo(() => {
    const abs = Math.abs(transaction.amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return transaction.type === 'INCOME' ? `+₹${abs}` : `-₹${abs}`;
  }, [transaction.amount, transaction.type]);

  const displayName = useMemo(
    () => (transaction.notes?.trim() ? transaction.notes.toUpperCase() : transaction.category.toUpperCase()),
    [transaction.notes, transaction.category],
  );

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      className="flex-row items-center bg-card border-2 border-border p-3 mb-3 shadow-sm"
    >
      <View
        className="w-10 h-10 items-center justify-center mr-3"
        style={{ backgroundColor: config.bg }}
      >
        <MaterialIcons name={config.icon as any} size={20} color="#fff" />
      </View>

      <View className="flex-1">
        <CustomText variant="label" className="font-sans-bold tracking-wider">
          {displayName}
        </CustomText>
        <CustomText variant="muted" className="text-xs">
          {formattedTime}
        </CustomText>
      </View>

      <CustomText className="font-sans-bold text-lg text-foreground">
        {formattedAmount}
      </CustomText>
    </TouchableOpacity>
  );
};

export default memo(TransactionCard);
