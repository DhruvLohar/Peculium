import { useQuery, useMutation, type QueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import supabase, { getSessionUser } from '../utils/supabase';
import { OFFLINE_WRITE_SCOPE } from './useTransactions';

// Manual types since monthly_budgets is not in database.types.ts
interface MonthlyBudgetRow {
  id: string;
  user_id: string;
  month_year: string; // Format: 'YYYY-MM'
  amount: number;
  created_at: string;
  updated_at: string;
}

export const BUDGET_MUTATION_KEY = ['monthly-budget', 'upsert'] as const;

// monthYear travels with the write so a replay after midnight on the 31st hits the right month
export type QueuedBudgetUpsert = { amount: number; monthYear: string };

/** Registers the offline-queued budget write. Must run before the persisted cache is restored. */
export const registerBudgetMutations = (queryClient: QueryClient) => {
  queryClient.setMutationDefaults(BUDGET_MUTATION_KEY, {
    scope: OFFLINE_WRITE_SCOPE,
    mutationFn: async ({ amount, monthYear }: QueuedBudgetUpsert): Promise<void> => {
      const user = await getSessionUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('monthly_budgets').upsert(
        { user_id: user.id, month_year: monthYear, amount, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,month_year' }
      );
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ amount, monthYear }: QueuedBudgetUpsert) => {
      queryClient.setQueryData(['monthly-budget', monthYear], { amount });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['monthly-budget'] }),
  });
};

export const useMonthlyBudget = () => {

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
      const user = await getSessionUser();
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

  const upsertMutation = useMutation<void, Error, QueuedBudgetUpsert>({
    mutationKey: BUDGET_MUTATION_KEY,
  });

  const { mutate: upsert } = upsertMutation;
  const saveBudget = useCallback(
    (amount: number) => upsert({ amount, monthYear: currentMonthYear }),
    [upsert, currentMonthYear]
  );

  return {
    budget: query.data,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    upsertBudget: upsertMutation,
    saveBudget,
  };
};
