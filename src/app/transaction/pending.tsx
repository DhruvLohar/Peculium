import React, { memo, useCallback } from 'react';
import { ScrollView, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Container } from '@/components/Container';
import ScreenHeader from '@/components/ScreenHeader';
import CustomText from '@/components/atoms/CustomText';
import Loader from '@/components/atoms/Loader';
import TransactionCard from '@/components/screens/transactions/TransactionCard';
import { usePendingTransactions } from '@/hooks/useTransactions';

const PendingTransactionsScreen: React.FC = () => {
  const router = useRouter();
  const { data: transactions = [], isLoading, isRefetching, refetch } = usePendingTransactions();

  // Opened from a notification on a cold start there is nothing to go back to
  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [router]);

  const handleCardPress = useCallback(
    (id: string) => {
      router.push(`/transaction/edit?id=${id}`);
    },
    [router]
  );

  return (
    <Container>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#ffdb33"
            colors={['#ffdb33']}
          />
        }>
        <ScreenHeader
          title="Needs Review"
          subtitle="Captured from bank SMS. Pick a category to add them to your totals."
          onBack={handleBack}
        />

        {isLoading ? (
          <View className="items-center justify-center py-20">
            <Loader />
          </View>
        ) : transactions.length === 0 ? (
          <View className="items-center justify-center py-20">
            <CustomText variant="muted" className="text-center">
              All caught up. Nothing to review.
            </CustomText>
          </View>
        ) : (
          <View className="mr-1">
            {transactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onPress={handleCardPress}
              />
            ))}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </Container>
  );
};

export default memo(PendingTransactionsScreen);
