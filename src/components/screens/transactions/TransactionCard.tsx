import React, { memo, useMemo, useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';
import CustomText from '@/components/atoms/CustomText';
import type { Database } from '@/utils/database.types';

type TransactionRow = Database['public']['Tables']['transactions']['Row'];
type TransactionCategory = Database['public']['Enums']['transaction_category'];

const CATEGORY_CONFIG: Record<TransactionCategory, { bg: string; emoji: string }> = {
  Food: { bg: '#a855f7', emoji: '☕' },
  Salary: { bg: '#22c55e', emoji: '💼' },
  Groceries: { bg: '#06b6d4', emoji: '🛒' },
  Travel: { bg: '#ec4899', emoji: '🚗' },
  Home: { bg: '#3b82f6', emoji: '🏠' },
  Rent: { bg: '#f97316', emoji: '🏘️' },
  Health: { bg: '#ef4444', emoji: '💊' },
  Other: { bg: '#6b7280', emoji: '📦' },
};

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
    return transaction.type === 'INCOME' ? `+$${abs}` : `-$${abs}`;
  }, [transaction.amount, transaction.type]);

  const displayName = useMemo(
    () => (transaction.notes?.trim() ? transaction.notes.toUpperCase() : transaction.category.toUpperCase()),
    [transaction.notes, transaction.category],
  );

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      className="flex-row items-center bg-white border-2 border-secondary p-3 mb-3 shadow-sm"
    >
      <View
        className="w-10 h-10 items-center justify-center mr-3"
        style={{ backgroundColor: config.bg }}
      >
        <CustomText className="text-base">{config.emoji}</CustomText>
      </View>

      <View className="flex-1">
        <CustomText variant="label" className="text-secondary font-sans-bold tracking-wider">
          {displayName}
        </CustomText>
        <CustomText variant="muted" className="text-xs" style={{ color: '#6b7280' }}>
          {formattedTime}
        </CustomText>
      </View>

      <CustomText
        variant="label"
        className="font-sans-bold"
        style={{ color: transaction.type === 'INCOME' ? '#22c55e' : '#e63946' }}
      >
        {formattedAmount}
      </CustomText>
    </TouchableOpacity>
  );
};

export default memo(TransactionCard);
