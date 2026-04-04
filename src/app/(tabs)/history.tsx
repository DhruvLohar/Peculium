import React, { memo, useState, useMemo, useCallback } from 'react';
import { ScrollView, RefreshControl, View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Container } from '@/components/Container';
import CustomText from '@/components/atoms/CustomText';
import FloatingActionButton from '@/components/atoms/FloatingActionButton';
import TransactionSearchBar from '@/components/screens/transactions/TransactionSearchBar';
import TransactionFilterBar, {
  type FilterOption,
} from '@/components/screens/transactions/TransactionFilterBar';
import TransactionDateGroup from '@/components/screens/transactions/TransactionDateGroup';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import {
  TRANSACTION_FILTERS_SHEET_ID,
  type TransactionFilterArgs,
} from '@/components/bottomsheets/TransactionFilters';
import { useTransactions } from '@/hooks/useTransactions';
import type { TransactionCategory, TransactionType } from '@/hooks/useTransactions';
import type { Database } from '@/utils/database.types';

type TransactionRow = Database['public']['Tables']['transactions']['Row'];

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'TODAY';
  if (date.toDateString() === yesterday.toDateString()) return 'YESTERDAY';

  return date
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    .toUpperCase();
}

function getStartOfWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function groupByDate(
  transactions: TransactionRow[],
): { label: string; data: TransactionRow[] }[] {
  const grouped = new Map<string, TransactionRow[]>();

  for (const t of transactions) {
    const label = getDateLabel(t.transaction_date);
    if (!grouped.has(label)) grouped.set(label, []);
    grouped.get(label)!.push(t);
  }

  return Array.from(grouped.entries()).map(([label, data]) => ({ label, data }));
}

const HistoryScreen: React.FC = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL');
  const [sheetType, setSheetType] = useState<TransactionType | null>(null);
  const [sheetCategories, setSheetCategories] = useState<TransactionCategory[]>([]);

  const { open: openFilters } = useBottomSheet<TransactionFilterArgs>(TRANSACTION_FILTERS_SHEET_ID);

  const { data: transactions = [], isLoading, isRefetching, refetch } = useTransactions();

  const handleApplyFilters = useCallback(
    ({ type, categories }: { type: TransactionType | null; categories: TransactionCategory[] }) => {
      setSheetType(type);
      setSheetCategories(categories);
    },
    [],
  );

  const handleOpenFilters = useCallback(() => {
    openFilters({
      onApply: handleApplyFilters,
      currentType: sheetType,
      currentCategories: sheetCategories,
    });
  }, [openFilters, handleApplyFilters, sheetType, sheetCategories]);

  const filtered = useMemo(() => {
    let result = transactions;

    if (activeFilter === 'INCOME') {
      result = result.filter((t) => t.type === 'INCOME');
    } else if (activeFilter === 'EXPENSE') {
      result = result.filter((t) => t.type === 'EXPENSE');
    } else if (activeFilter === 'THIS_WEEK') {
      const weekStart = getStartOfWeek();
      result = result.filter((t) => new Date(t.transaction_date) >= weekStart);
    }

    if (sheetType) {
      result = result.filter((t) => t.type === sheetType);
    }

    if (sheetCategories.length > 0) {
      result = result.filter((t) => sheetCategories.includes(t.category));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.notes?.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q),
      );
    }

    return result;
  }, [transactions, activeFilter, sheetType, sheetCategories, search]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  const handleCardPress = useCallback((_id: string) => {
    // TODO: navigate to transaction detail
  }, []);

  const handleAddTransaction = useCallback(() => {
    router.push('/transaction/add');
  }, [router]);

  return (
    <Container>
      <View className="pt-8 pb-4">
        <View className="items-start mb-4">
          <CustomText variant="h2">
            Transactions
          </CustomText>
          <CustomText variant="muted" className="text-center">
            Manage your finance, so you can live your life.
          </CustomText>
        </View>
        <TransactionSearchBar value={search} onChangeText={setSearch} onFilterPress={handleOpenFilters} />
        <View className="mt-4">
          <TransactionFilterBar active={activeFilter} onChange={setActiveFilter} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#ffdb33"
            colors={['#ffdb33']}
          />
        }
      >
        {isLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator color="#ffdb33" size="large" />
          </View>
        ) : groups.length === 0 ? (
          <View className="items-center justify-center py-20">
            <CustomText variant="muted" className="text-center" style={{ color: '#555555' }}>
              No transactions found.
            </CustomText>
          </View>
        ) : (
          groups.map((group) => (
            <TransactionDateGroup
              key={group.label}
              label={group.label}
              transactions={group.data}
              onCardPress={handleCardPress}
            />
          ))
        )}
        <View className="h-8" />
      </ScrollView>

      <FloatingActionButton onPress={handleAddTransaction} variant="default" size="lg">
        <Text className="text-3xl font-bold text-primary-foreground">+</Text>
      </FloatingActionButton>
    </Container>
  );
};

export default memo(HistoryScreen);
