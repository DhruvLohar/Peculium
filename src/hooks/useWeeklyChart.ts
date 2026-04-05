import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import supabase from '../utils/supabase';
import type { StackedBarChartDataPoint } from '../components/atoms/StackedBarChart';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const useWeeklyChart = () => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - 6);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const query = useQuery({
    queryKey: ['weekly-chart', startOfWeek.toISOString().slice(0, 10)],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .select('amount, type, transaction_date')
        .eq('user_id', user.id)
        .gte('transaction_date', startOfWeek.toISOString())
        .lte('transaction_date', endOfDay.toISOString());

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const chartData = useMemo<StackedBarChartDataPoint[]>(() => {
    const buckets: Record<string, { Income: number; Expense: number }> = {};

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { Income: 0, Expense: 0 };
    }

    for (const tx of query.data ?? []) {
      const key = tx.transaction_date.slice(0, 10);
      if (buckets[key]) {
        if (tx.type === 'INCOME') {
          buckets[key].Income += tx.amount;
        } else {
          buckets[key].Expense += tx.amount;
        }
      }
    }

    return Object.entries(buckets).map(([dateStr, values]) => {
      const day = new Date(dateStr + 'T00:00:00');
      return {
        label: DAY_LABELS[day.getDay()],
        values,
      };
    });
  }, [query.data, startOfWeek]);

  return {
    ...query,
    chartData,
  };
};
