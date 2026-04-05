import React, { memo, useState, useMemo, useCallback } from 'react';
import { ScrollView, RefreshControl, View, ActivityIndicator, Text, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Container } from '@/components/Container';
import CustomText from '@/components/atoms/CustomText';
import FloatingActionButton from '@/components/atoms/FloatingActionButton';
import Loader from '@/components/atoms/Loader';
import TransactionSearchBar from '@/components/screens/transactions/TransactionSearchBar';
import TransactionFilterBar, {
  type FilterOption,
} from '@/components/screens/transactions/TransactionFilterBar';
import TransactionDateGroup from '@/components/screens/transactions/TransactionDateGroup';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import {
  TRANSACTION_FILTERS_SHEET_ID,
  TransactionFiltersSheet,
  type TransactionFilterArgs,
} from '@/components/bottomsheets/TransactionFilters';
import { useInfiniteTransactions } from '@/hooks/useTransactions';
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

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteTransactions();

  // Flatten all pages into single array
  const allTransactions = useMemo(
    () => data?.pages.flatMap((page) => page.transactions) ?? [],
    [data],
  );

  // Refetch transactions when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

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
    let result = allTransactions;

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
  }, [allTransactions, activeFilter, sheetType, sheetCategories, search]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  const handleCardPress = useCallback((id: string) => {
    router.push(`/transaction/edit?id=${id}`);
  }, [router]);

  const handleAddTransaction = useCallback(() => {
    router.push('/transaction/add');
  }, [router]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      
      // Check if user is near bottom (within 200px)
      const paddingToBottom = 200;
      const isCloseToBottom =
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - paddingToBottom;

      if (isCloseToBottom && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  return (
    <Container>
      <View className="pt-8 pb-10">
        <View className="items-start mb-4">
          <CustomText variant="h2">
            Transactions
          </CustomText>
          <CustomText variant="muted" className="text-center">
            Manage your finance, so you can live your life.
          </CustomText>
        </View>
        <TransactionSearchBar value={search} onChangeText={setSearch} onFilterPress={handleOpenFilters} />
        <View className="mt-6">
          <TransactionFilterBar active={activeFilter} onChange={setActiveFilter} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={400}
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
            <Loader />
          </View>
        ) : groups.length === 0 ? (
          <View className="items-center justify-center py-20">
            <CustomText variant="muted" className="text-center" style={{ color: '#555555' }}>
              No transactions found.
            </CustomText>
          </View>
        ) : (
          <>
            {groups.map((group) => (
              <TransactionDateGroup
                key={group.label}
                label={group.label}
                transactions={group.data}
                onCardPress={handleCardPress}
              />
            ))}
            
            {/* Loading indicator for next page */}
            {isFetchingNextPage && (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#ffdb33" />
              </View>
            )}
            
            {/* End of list indicator */}
            {!hasNextPage && filtered.length > 0 && (
              <View className="py-4 items-center">
                <CustomText variant="muted" className="text-xs">
                  No more transactions
                </CustomText>
              </View>
            )}
          </>
        )}
        <View className="h-8" />
      </ScrollView>

      <FloatingActionButton onPress={handleAddTransaction} variant="default" size="lg">
        <Text className="text-3xl font-bold text-primary-foreground">+</Text>
      </FloatingActionButton>

      <TransactionFiltersSheet />
    </Container>
  );
};

export default memo(HistoryScreen);
