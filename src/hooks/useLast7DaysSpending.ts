import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import supabase from '../utils/supabase';
import type { BarChartDataPoint } from '../components/atoms/BarChart';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const useLast7DaysSpending = () => {
  const today = new Date();
  const startOfPeriod = new Date(today);
  startOfPeriod.setDate(today.getDate() - 6);
  startOfPeriod.setHours(0, 0, 0, 0);

  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const query = useQuery({
    queryKey: ['last-7-days-spending', startOfPeriod.toISOString().slice(0, 10)],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .select('amount, type, transaction_date')
        .eq('user_id', user.id)
        .eq('type', 'EXPENSE')
        .gte('transaction_date', startOfPeriod.toISOString())
        .lte('transaction_date', endOfDay.toISOString());

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const chartData = useMemo<BarChartDataPoint[]>(() => {
    // Create array of dates for last 7 days (oldest to newest)
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfPeriod);
      d.setDate(startOfPeriod.getDate() + i);
      dates.push(d);
    }

    // Create buckets for each day
    const buckets: Record<string, number> = {};
    dates.forEach(d => {
      const key = d.toISOString().slice(0, 10);
      buckets[key] = 0;
    });

    // Sum expenses by day
    for (const tx of query.data ?? []) {
      const key = tx.transaction_date.slice(0, 10);
      if (buckets[key] !== undefined) {
        buckets[key] += Number(tx.amount);
      }
    }

    // Get today and yesterday strings for comparison
    const todayStr = today.toISOString().slice(0, 10);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    // Map dates to chart data points (in order from oldest to newest)
    return dates.map(date => {
      const dateStr = date.toISOString().slice(0, 10);
      const value = buckets[dateStr] || 0;
      let label: string;

      if (dateStr === todayStr) {
        label = 'Today';
      } else if (dateStr === yesterdayStr) {
        label = 'Yesterday';
      } else {
        const day = date.getDate().toString().padStart(2, '0');
        const dayName = DAY_LABELS[date.getDay()];
        label = `${day} ${dayName}`;
      }

      return {
        label,
        value: Math.round(value),
      };
    });
  }, [query.data, startOfPeriod, today]);

  return {
    ...query,
    chartData,
  };
};
