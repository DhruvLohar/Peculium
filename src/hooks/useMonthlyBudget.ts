import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import supabase from '../utils/supabase';

// Manual types since monthly_budgets is not in database.types.ts
interface MonthlyBudgetRow {
  id: string;
  user_id: string;
  month_year: string; // Format: 'YYYY-MM'
  amount: number;
  created_at: string;
  updated_at: string;
}

export const useMonthlyBudget = () => {
  const queryClient = useQueryClient();

  // Get current month in YYYY-MM format
  const currentMonthYear = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, []);

  // Query to fetch current month's budget
  const query = useQuery({
    queryKey: ['monthly-budget', currentMonthYear],
    queryFn: async (): Promise<{ amount: number } | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('monthly_budgets')
        .select('amount')
        .eq('user_id', user.id)
        .eq('month_year', currentMonthYear)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data ? { amount: Number(data.amount) } : null;
    },
  });

  // Mutation to upsert budget
  const upsertBudget = useMutation({
    mutationFn: async (amount: number): Promise<void> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('monthly_budgets').upsert(
        {
          user_id: user.id,
          month_year: currentMonthYear,
          amount,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,month_year',
        },
      );

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-budget'] });
    },
  });

  return {
    budget: query.data,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    upsertBudget,
  };
};
