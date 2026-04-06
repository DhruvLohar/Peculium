import React, { memo, useCallback, useMemo } from 'react';
import { ScrollView, RefreshControl, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Container } from '@/components/Container';
import CustomText from '@/components/atoms/CustomText';
import BarChart from '@/components/atoms/BarChart';
import DashboardCards from '@/components/Dashboard/DashboardCards';
import MonthlySpendBudgetCard from '@/components/Dashboard/MonthlySpendBudgetCard';
import AnalyzeMicroSpend from '@/components/Dashboard/AnalyzeMicroSpend';
import StreakCard from '@/components/Dashboard/StreakCard';
import { EditMonthlyBudgetSheet } from '@/components/bottomsheets/EditMonthlyBudgetSheet';
import StreakExplainerSheet from '@/components/bottomsheets/StreakExplainerSheet';
import { useUser } from '@/hooks/useUser';
import { useDashboard } from '@/hooks/useDashboard';
import { useLast7DaysSpending } from '@/hooks/useLast7DaysSpending';
import { useMonthlyBudget } from '@/hooks/useMonthlyBudget';
import { useStreak } from '@/hooks/useStreak';

const Home: React.FC = () => {
  const router = useRouter();
  const { data: user } = useUser();
  const { stats, isRefetching, refetch } = useDashboard();
  const { chartData, isRefetching: isChartRefetching, refetch: refetchChart } = useLast7DaysSpending();
  
  // Get current month's stats for budget card
  const currentDate = useMemo(() => new Date(), []);
  const { stats: monthStats, isRefetching: isMonthRefetching, refetch: refetchMonth } = useDashboard({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
  });
  const { budget, isRefetching: isBudgetRefetching, refetch: refetchBudget } = useMonthlyBudget();
  const { data: streakData, isRefetching: isStreakRefetching, refetch: refetchStreak } = useStreak();

  const displayName = useMemo(
    () => (user?.user_metadata?.display_name as string | undefined) ?? '',
    [user],
  );

  const initial = useMemo(() => displayName[0]?.toUpperCase() ?? '?', [displayName]);

  const handleNavigateToProfile = useCallback(() => {
    router.push('/profile');
  }, [router]);

  const handleRefresh = useCallback(() => {
    refetch();
    refetchChart();
    refetchMonth();
    refetchBudget();
    refetchStreak();
  }, [refetch, refetchChart, refetchMonth, refetchBudget, refetchStreak]);

  return (
    <Container>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching || isChartRefetching || isMonthRefetching || isBudgetRefetching || isStreakRefetching}
            onRefresh={handleRefresh}
            tintColor="#ffdb33"
            colors={['#ffdb33']}
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-center gap-3 pt-8 pb-6">
          <Pressable
            onPress={handleNavigateToProfile}
            className="w-12 h-12 bg-primary border-2 border-border items-center justify-center"
          >
            <CustomText variant="h4" className="leading-none" darkInvert>
              {initial}
            </CustomText>
          </Pressable>
          <View>
            <CustomText variant="label" className="text-xs tracking-widest">
              GOOD MORNING
            </CustomText>
            <CustomText variant="h3">
              {displayName}
            </CustomText>
          </View>
          
          <StreakCard
            currentStreak={streakData?.current_streak ?? 0}
            longestStreak={streakData?.longest_streak ?? 0}
          />
        </View>

        {/* Dashboard Cards */}
        <DashboardCards
          balance={stats.availableBalance}
          income={stats.totalIncome}
          expense={stats.totalExpense}
        />

        {/* Monthly Budget Card */}
        <View className="mt-6 pr-1">
          <MonthlySpendBudgetCard
            currentSpend={monthStats.totalExpense}
            totalBudget={budget?.amount ?? 0}
          />
        </View>

        {/* Last 7 Days Spending */}
        <View className="mt-8">
          <View className="mb-8">
            <CustomText variant="h4" className="mb-2">
              Last 7 Days Spending
            </CustomText>
            <View 
              style={{ width: '100%', height: 2 }}
              className="bg-foreground"
            />
          </View>
          {chartData.length > 0 ? (
            <BarChart
              data={chartData}
              height={240}
              tooltipHeaders={['DAY', 'SPENT']}
            />
          ) : (
            <View className="h-60 items-center justify-center bg-muted/10 border-2 border-border">
              <CustomText variant="muted">No spending data available</CustomText>
            </View>
          )}
        </View>

        {/* Micro Spend Analyzer */}
        <View className="mt-8 pr-1">
          <AnalyzeMicroSpend />
        </View>

        <View className="h-8" />
      </ScrollView>

      {/* Bottom Sheets */}
      <EditMonthlyBudgetSheet />
      <StreakExplainerSheet />
    </Container>
  );
};

export default memo(Home);
