import React, { memo, useMemo, useCallback } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import CustomText from '@/components/atoms/CustomText';
import Badge from '@/components/atoms/Badge';
import { CATEGORY_CONFIG } from '@/utils/categoryConfig';
import type { Database } from '@/utils/database.types';

type TransactionRow = Database['public']['Tables']['transactions']['Row'];
type TransactionCategory = Database['public']['Enums']['transaction_category'];

const UNCATEGORIZED = { icon: 'help-outline', bg: '#6b7280' };

interface TransactionCardProps {
  transaction: TransactionRow;
  onPress?: (id: string) => void;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, onPress }) => {
  const handlePress = useCallback(() => {
    onPress?.(transaction.id);
  }, [onPress, transaction.id]);

  const isPending = transaction.status === 'PENDING_REVIEW';

  const config = useMemo(
    () =>
      transaction.category
        ? (CATEGORY_CONFIG[transaction.category as TransactionCategory] ?? CATEGORY_CONFIG.Other)
        : UNCATEGORIZED,
    [transaction.category]
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
    () =>
      transaction.notes?.trim()
        ? transaction.notes.toUpperCase()
        : (transaction.category ?? 'UNCATEGORIZED').toUpperCase(),
    [transaction.notes, transaction.category]
  );

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      className="mb-3 flex-row items-center border-2 border-border bg-card p-3 shadow-sm">
      <View
        className="mr-3 h-10 w-10 items-center justify-center"
        style={{ backgroundColor: config.bg }}>
        <MaterialIcons name={config.icon as any} size={20} color="#fff" />
      </View>

      <View className="flex-1">
        <CustomText variant="label" className="font-sans-bold tracking-wider">
          {displayName}
        </CustomText>
        <CustomText variant="muted" className="text-xs">
          {formattedTime}
        </CustomText>
        {isPending && <Badge label="NEEDS CATEGORY" variant="warning" className="mt-1" />}
      </View>

      <CustomText className="font-sans-bold text-lg text-foreground">{formattedAmount}</CustomText>
    </TouchableOpacity>
  );
};

export default memo(TransactionCard);
