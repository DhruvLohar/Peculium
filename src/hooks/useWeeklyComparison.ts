import { useQuery } from '@tanstack/react-query';
import supabase from '../utils/supabase';

export interface WeeklySpending {
  label: string;
  startDate: string;
  endDate: string;
  amount: number;
  transactionCount: number;
}

/**
 * Get start of week (Sunday) for a given date in local timezone
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day); // Go back to Sunday
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of week (Saturday) for a given date in local timezone
 */
function getWeekEnd(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() + (6 - day)); // Go forward to Saturday
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Hook to fetch this week vs last week spending comparison
 */
export const useWeeklyComparison = () => {
  return useQuery({
    queryKey: ['weekly-comparison'],
    queryFn: async (): Promise<{ thisWeek: WeeklySpending; lastWeek: WeeklySpending }> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const now = new Date();
      
      // This week boundaries (Sunday to Saturday)
      const thisWeekStart = getWeekStart(now);
      const thisWeekEnd = getWeekEnd(now);
      
      // Last week boundaries (7 days before this week)
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(thisWeekEnd);
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

      console.log('This Week:', thisWeekStart.toISOString(), 'to', thisWeekEnd.toISOString());
      console.log('Last Week:', lastWeekStart.toISOString(), 'to', lastWeekEnd.toISOString());

      // Fetch this week's expenses
      const { data: thisWeekData, error: thisWeekError } = await supabase
        .from('transactions')
        .select('amount, transaction_date')
        .eq('user_id', user.id)
        .eq('type', 'EXPENSE')
        .gte('transaction_date', thisWeekStart.toISOString())
        .lte('transaction_date', thisWeekEnd.toISOString());

      if (thisWeekError) throw new Error(thisWeekError.message);

      // Fetch last week's expenses
      const { data: lastWeekData, error: lastWeekError } = await supabase
        .from('transactions')
        .select('amount, transaction_date')
        .eq('user_id', user.id)
        .eq('type', 'EXPENSE')
        .gte('transaction_date', lastWeekStart.toISOString())
        .lte('transaction_date', lastWeekEnd.toISOString());

      if (lastWeekError) throw new Error(lastWeekError.message);

      // Calculate totals
      const thisWeekAmount = thisWeekData?.reduce((sum, tx) => {
        const amount = parseFloat(tx.amount.toString());
        return sum + amount;
      }, 0) ?? 0;
      
      const lastWeekAmount = lastWeekData?.reduce((sum, tx) => {
        const amount = parseFloat(tx.amount.toString());
        return sum + amount;
      }, 0) ?? 0;

      console.log('This Week Amount:', thisWeekAmount, 'Count:', thisWeekData?.length ?? 0);
      console.log('Last Week Amount:', lastWeekAmount, 'Count:', lastWeekData?.length ?? 0);

      return {
        thisWeek: {
          label: 'This Week',
          startDate: thisWeekStart.toISOString(),
          endDate: thisWeekEnd.toISOString(),
          amount: thisWeekAmount,
          transactionCount: thisWeekData?.length ?? 0,
        },
        lastWeek: {
          label: 'Last Week',
          startDate: lastWeekStart.toISOString(),
          endDate: lastWeekEnd.toISOString(),
          amount: lastWeekAmount,
          transactionCount: lastWeekData?.length ?? 0,
        },
      };
    },
    staleTime: 1 * 60 * 1000, // 1 minute (shorter for debugging)
  });
};
