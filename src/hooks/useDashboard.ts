import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import supabase from '../utils/supabase';
import type { Database } from '../utils/database.types';

type TransactionRow = Database['public']['Tables']['transactions']['Row'];

export interface DashboardStats {
  availableBalance: number;
  totalIncome: number;
  totalExpense: number;
}

export interface DashboardFilters {
  month?: number; // 1–12
  year?: number; // e.g. 2026
}

/**
 * Query hook to fetch dashboard statistics
 * Calculates available balance, total income, and total expense
 * Optionally filtered by month/year
 */
export const useDashboard = (filters?: DashboardFilters) => {
  const query = useQuery({
    queryKey: ['dashboard', filters],
    queryFn: async (): Promise<TransactionRow[]> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);

      // Month + year filter: gte start of month, lt start of next month
      if (filters?.month && filters?.year) {
        const start = new Date(filters.year, filters.month - 1, 1).toISOString();
        const end = new Date(filters.year, filters.month, 1).toISOString();
        query = query.gte('transaction_date', start).lt('transaction_date', end);
      } else if (filters?.year) {
        const start = new Date(filters.year, 0, 1).toISOString();
        const end = new Date(filters.year + 1, 0, 1).toISOString();
        query = query.gte('transaction_date', start).lt('transaction_date', end);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const stats = useMemo<DashboardStats>(() => {
    const transactions = query.data ?? [];

    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const availableBalance = totalIncome - totalExpense;

    return {
      availableBalance,
      totalIncome,
      totalExpense,
    };
  }, [query.data]);

  return {
    ...query,
    stats,
  };
};
