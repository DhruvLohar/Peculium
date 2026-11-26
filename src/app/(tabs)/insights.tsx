import React, { memo, useCallback } from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Container } from '@/components/Container';
import ScreenHeader from '@/components/ScreenHeader';
import AnalyzeCategorySpend from '@/components/Insights/AnalyzeCategorySpend';
import WeeklyComparison from '@/components/Insights/WeeklyComparison';
import { useWeeklyComparison } from '@/hooks/useWeeklyComparison';
import { getThemeColors } from '@/utils/themeColors';
import RefreshableScrollView from '@/components/atoms/RefreshableScrollView';

const InsightsScreen: React.FC = () => {
  const { refetch, isRefetching } = useWeeklyComparison();
  const { colorScheme } = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <Container>
      <RefreshableScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={handleRefresh}
        tintColor={colors.foreground}>
        <ScreenHeader
          title="Insights"
          subtitle="Where your money actually goes"
          showBackButton={false}
        />
        <View className="gap-6 pb-10">
          <AnalyzeCategorySpend />
          <WeeklyComparison />
        </View>
      </RefreshableScrollView>
    </Container>
  );
};

export default memo(InsightsScreen);
