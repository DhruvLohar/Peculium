import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import CustomText from '@/components/atoms/CustomText';
import { useWeeklyComparison } from '@/hooks/useWeeklyComparison';
import { getThemeColors } from '@/utils/themeColors';

const MONTH_NAMES = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

const WeeklyComparison: React.FC = () => {
  const { data, isLoading } = useWeeklyComparison();
  const { colorScheme } = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');

  const lastWeek = data?.lastWeek;
  const thisWeek = data?.thisWeek;

  // Calculate percentages for the "tug of war"
  const { lastPercent, currentPercent, diffPercent, isOver, isEqual } = useMemo(() => {
    if (!lastWeek || !thisWeek) {
      return { lastPercent: 50, currentPercent: 50, diffPercent: 0, isOver: false, isEqual: true };
    }

    const total = lastWeek.amount + thisWeek.amount;
    let lastP = total === 0 ? 50 : (lastWeek.amount / total) * 100;
    let currentP = total === 0 ? 50 : (thisWeek.amount / total) * 100;
    
    // Cap at 75% max to prevent extreme visual imbalance
    const MAX_PERCENT = 60;
    const MIN_PERCENT = 40;
    
    if (lastP > MAX_PERCENT) {
      lastP = MAX_PERCENT;
      currentP = MIN_PERCENT;
    } else if (currentP > MAX_PERCENT) {
      currentP = MAX_PERCENT;
      lastP = MIN_PERCENT;
    }
    
    const diff = thisWeek.amount - lastWeek.amount;
    const diffP = lastWeek.amount === 0 ? 100 : Math.round(Math.abs(diff) / lastWeek.amount * 100);
    
    return {
      lastPercent: lastP,
      currentPercent: currentP,
      diffPercent: diffP,
      isOver: diff > 0,
      isEqual: diff === 0,
    };
  }, [lastWeek, thisWeek]);

  // Dynamic colors based on comparison
  const { currentBg, msg, textColor } = useMemo(() => {
    if (isEqual) {
      return { currentBg: '#facc15', msg: 'Holding Steady', textColor: '#000' };
    }
    if (isOver) {
      return { currentBg: '#ef4444', msg: 'Bleeding Cash', textColor: '#000' };
    }
    return { currentBg: '#a3e635', msg: 'Saving Money', textColor: '#000' };
  }, [isEqual, isOver]);

  // Format week date range
  const formatWeekLabel = useMemo(() => {
    if (!lastWeek || !thisWeek) return { last: '---', current: '---' };
    
    const lastStart = new Date(lastWeek.startDate);
    const lastEnd = new Date(lastWeek.endDate);
    const thisStart = new Date(thisWeek.startDate);
    const thisEnd = new Date(thisWeek.endDate);
    
    return {
      last: `${MONTH_NAMES[lastStart.getMonth()]} ${lastStart.getDate()}-${lastEnd.getDate()}`,
      current: `${MONTH_NAMES[thisStart.getMonth()]} ${thisStart.getDate()}-${thisEnd.getDate()}`,
    };
  }, [lastWeek, thisWeek]);

  if (isLoading) {
    return (
      <View
        className="border border-border bg-card"
        style={{ boxShadow: `4px 4px 0 0 ${colors.border}` }}
      >
        <View className="border-b border-border px-4 py-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <MaterialIcons name="compare-arrows" size={20} color={colors.foreground} />
            <CustomText variant="label" className="text-xs tracking-widest">
              WEEKLY COMPARISON
            </CustomText>
          </View>
        </View>
        <View className="p-8 items-center">
          <CustomText variant="muted" className="text-xs tracking-widest">
            LOADING...
          </CustomText>
        </View>
      </View>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <View
      className="border border-border bg-card"
      style={{ boxShadow: `4px 4px 0 0 ${colors.border}` }}
    >
      {/* Header */}
      <View className="border-b border-border px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <MaterialIcons name="compare-arrows" size={20} color={colors.foreground} />
          <CustomText variant="label" className="text-xs tracking-widest">
            THIS WEEK VS LAST WEEK
          </CustomText>
        </View>
      </View>

      {/* Tug of War Visualization */}
      <View className="overflow-hidden" style={{ height: 360 }}>
        {/* TOP HALF: Last Week */}
        <View
          className="bg-zinc-900 w-full flex-col justify-between p-5"
          style={{ flexBasis: `${lastPercent}%` }}
        >
          <View className="flex-row justify-between items-start">
            <CustomText
              className="text-zinc-500 text-xs tracking-widest pt-2"
              style={{ fontWeight: '900' }}
            >
              LAST WEEK
            </CustomText>

            {/* Delta Badge */}
            {!isEqual && (
              <View
                className="bg-background border-2 border-border px-2 py-1"
                style={{ boxShadow: `2px 2px 0 0 ${colors.border}` }}
              >
                <View className="flex-row items-center gap-1">
                  <MaterialIcons
                    name={isOver ? 'arrow-upward' : 'arrow-downward'}
                    size={16}
                    color={isOver ? '#ef4444' : '#a3e635'}
                  />
                  <CustomText className="text-foreground text-base" style={{ fontWeight: '900' }}>
                    {diffPercent}%
                  </CustomText>
                </View>
                <CustomText
                  className="text-zinc-500 text-[10px] tracking-widest"
                  style={{ fontWeight: '900' }}
                >
                  {isOver ? 'MORE' : 'LESS'}
                </CustomText>
              </View>
            )}

            {isEqual && (
              <View
                className="bg-background border-2 border-border px-2 py-1"
                style={{ boxShadow: `2px 2px 0 0 ${colors.border}` }}
              >
                <CustomText className="text-foreground text-base" style={{ fontWeight: '900' }}>
                  0%
                </CustomText>
                <CustomText
                  className="text-zinc-500 text-[10px] tracking-widest"
                  style={{ fontWeight: '900' }}
                >
                  MATCH
                </CustomText>
              </View>
            )}
          </View>

          <View>
            <CustomText
              className="text-zinc-300"
              style={{ fontSize: 48, fontWeight: '900', letterSpacing: -2, lineHeight: 56 }}
              numberOfLines={1}
            >
              ₹{lastWeek?.amount.toLocaleString('en-IN') ?? '0'}
            </CustomText>
            <CustomText
              className="text-zinc-600 text-xs tracking-wide mt-1"
              style={{ fontWeight: '700' }}
            >
              {formatWeekLabel.last}
            </CustomText>
          </View>
        </View>

        {/* Dashed line separator */}
        <View
          className="absolute w-full border-t-4 border-dashed border-border z-10"
          style={{ top: `${lastPercent}%` }}
        />

        {/* BOTTOM HALF: This Week */}
        <View
          className="w-full flex-col justify-between p-5"
          style={{ flexBasis: `${currentPercent}%`, backgroundColor: currentBg }}
        >
          <View className="flex-row justify-between items-start pt-2">
            <CustomText
              className="text-[10px] tracking-widest opacity-60"
              style={{ fontWeight: '900', color: textColor }}
            >
              THIS WEEK
            </CustomText>
            <View
              className="border-2 border-border px-2 py-0.5"
              style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
            >
              <CustomText className="text-xs tracking-wider" style={{ fontWeight: '900', color: '#000' }}>
                {msg}
              </CustomText>
            </View>
          </View>

          <View>
            <CustomText
              style={{ fontSize: 48, fontWeight: '900', letterSpacing: -2, lineHeight: 56, color: textColor }}
              numberOfLines={1}
            >
              ₹{thisWeek?.amount.toLocaleString('en-IN') ?? '0'}
            </CustomText>
            <CustomText
              className="text-xs tracking-wide mt-1"
              style={{ fontWeight: '700', color: textColor, opacity: 0.7 }}
            >
              {formatWeekLabel.current}
            </CustomText>
          </View>
        </View>
      </View>
    </View>
  );
};

export default memo(WeeklyComparison);
