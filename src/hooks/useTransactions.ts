import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '../utils/supabase';
import type { Database } from '../utils/database.types';

// Type aliases for cleaner code
type TransactionRow = Database['public']['Tables']['transactions']['Row'];

// Use enums from database types
export type TransactionType = Database['public']['Enums']['transaction_type'];
export type TransactionCategory = Database['public']['Enums']['transaction_category'];

// Filter interface for querying transactions
export interface TransactionFilters {
  month?: number; // 1–12
  year?: number; // e.g. 2026
  type?: TransactionType;
  category?: TransactionCategory;
}

// New transaction payload (for add)
export type NewTransaction = {
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  notes?: string;
  transaction_date?: string; // ISO string, defaults to now
};

// Update transaction payload (for edit)
export type UpdateTransaction = Partial<NewTransaction> & { id: string };

const PAGE_SIZE = 20;

/**
 * Infinite query hook to fetch transactions with cursor-based pagination
 * Loads 20 transactions at a time, with infinite scroll support
 */
export const useTransactions = (filters?: TransactionFilters) => {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async (): Promise<TransactionRow[]> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

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

      if (filters?.type) query = query.eq('type', filters.type);
      if (filters?.category) query = query.eq('category', filters.category);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
};

/**
 * Infinite query hook for paginated transactions (for history screen)
 * Uses cursor-based pagination with 20 items per page
 */
export const useInfiniteTransactions = (filters?: TransactionFilters) => {
  return useInfiniteQuery({
    queryKey: ['transactions-infinite', filters],
    queryFn: async ({ pageParam }: { pageParam?: string }): Promise<{
      transactions: TransactionRow[];
      nextCursor: string | null;
    }> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      // Cursor-based pagination: fetch rows after the cursor
      if (pageParam) {
        // Parse cursor: "transaction_date|created_at"
        const [cursorDate, cursorCreated] = pageParam.split('|');
        query = query.or(
          `transaction_date.lt.${cursorDate},and(transaction_date.eq.${cursorDate},created_at.lt.${cursorCreated})`
        );
      }

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

      if (filters?.type) query = query.eq('type', filters.type);
      if (filters?.category) query = query.eq('category', filters.category);

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      const transactions = data ?? [];
      
      // Generate next cursor from last item
      const nextCursor =
        transactions.length === PAGE_SIZE && transactions.length > 0
          ? `${transactions[transactions.length - 1].transaction_date}|${transactions[transactions.length - 1].created_at}`
          : null;

      return { transactions, nextCursor };
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};

/**
 * Mutation hook to add a new transaction
 * Invalidates all transaction caches on success
 * Note: Streak update should be handled separately in the component
 */
export const useAddTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NewTransaction): Promise<TransactionRow> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions-infinite'] });
      // Note: Streak invalidation happens in useUpdateStreak
    },
  });
};

/**
 * Mutation hook to update an existing transaction
 * Invalidates all transaction caches on success
 */
export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateTransaction): Promise<TransactionRow> => {
      const { data, error } = await supabase
        .from('transactions')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

/**
 * Mutation hook to delete a transaction
 * Invalidates all transaction caches on success
 */
export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

/**
 * Query hook to fetch a single transaction by ID
 */
export const useTransaction = (id: string | null) => {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: async (): Promise<TransactionRow | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!id,
  });
};
