import React, { memo, useMemo } from 'react';
import { ScrollView, RefreshControl, View } from 'react-native';
import { Container } from '@/components/Container';
import CustomText from '@/components/atoms/CustomText';
import DashboardCards from '@/components/Dashboard/DashboardCards';
import { useUser } from '@/hooks/useUser';
import { useDashboard } from '@/hooks/useDashboard';

const Home: React.FC = () => {
  const { data: user } = useUser();
  const { stats, isRefetching, refetch } = useDashboard();

  const displayName = useMemo(
    () => (user?.user_metadata?.display_name as string | undefined) ?? '',
    [user],
  );

  const initial = useMemo(() => displayName[0]?.toUpperCase() ?? '?', [displayName]);

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
        }
      >
        {/* Header */}
        <View className="flex-row items-center gap-3 pt-8 pb-6">
          <View className="w-12 h-12 bg-primary border-2 border-black items-center justify-center">
            <CustomText variant="h4" className="leading-none">
              {initial}
            </CustomText>
          </View>
          <View>
            <CustomText variant="label" className="text-xs tracking-widest">
              GOOD MORNING
            </CustomText>
            <CustomText variant="h3">
              {displayName}
            </CustomText>
          </View>
        </View>

        {/* Dashboard Cards */}
        <DashboardCards
          balance={stats.availableBalance}
          income={stats.totalIncome}
          expense={stats.totalExpense}
        />
      </ScrollView>
    </Container>
  );
};

export default memo(Home);
