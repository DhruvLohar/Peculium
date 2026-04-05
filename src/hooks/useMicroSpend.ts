import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import supabase from '../utils/supabase';

interface MicroSpendResult {
  bleedTxns: number[];
  totalBleed: number;
  isLoading: boolean;
  isRefetching: boolean;
  refetch: () => void;
}

export const useMicroSpend = (threshold: number): MicroSpendResult => {
  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const query = useQuery({
    queryKey: ['micro-spend', monthYear],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

      const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'EXPENSE')
        .gte('transaction_date', start)
        .lt('transaction_date', end);

      if (error) throw new Error(error.message);
      return (data ?? []).map((t) => t.amount);
    },
  });

  const { bleedTxns, totalBleed } = useMemo(() => {
    const filtered = (query.data ?? []).filter((amount) => amount <= threshold);
    const sum = filtered.reduce((acc, curr) => acc + curr, 0);
    return { bleedTxns: filtered, totalBleed: sum };
  }, [query.data, threshold]);

  return {
    bleedTxns,
    totalBleed,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
  };
};
