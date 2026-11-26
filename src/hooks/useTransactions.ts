import { useQuery, useInfiniteQuery, useMutation, type QueryClient } from '@tanstack/react-query';
import supabase, { getPersistedUserId, getSessionUser } from '../utils/supabase';
import { RetryableError } from '../utils/network';
import { updateStreakRemote } from './useStreak';
import type { Database } from '../utils/database.types';

// Type aliases for cleaner code
export type TransactionRow = Database['public']['Tables']['transactions']['Row'];

// Use enums from database types
export type TransactionType = Database['public']['Enums']['transaction_type'];
export type TransactionCategory = Database['public']['Enums']['transaction_category'];
export type TransactionStatus = Database['public']['Enums']['transaction_status'];

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
 * Invalidates every query that reads transactions, including dashboard/insight aggregates.
 * Used when a row's status changes, since that moves it in or out of totals.
 */
export const invalidateTransactionQueries = (queryClient: QueryClient) => {
  const keys = [
    'transactions',
    'transactions-infinite',
    'pending-transactions',
    'transaction',
    'dashboard',
    'last-7-days-spending',
    'weekly-chart',
    'micro-spend',
    'weekly-comparison',
  ];
  keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
};

/**
 * Infinite query hook to fetch transactions with cursor-based pagination
 * Loads 20 transactions at a time, with infinite scroll support
 */
export const useTransactions = (filters?: TransactionFilters) => {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async (): Promise<TransactionRow[]> => {
      const user = await getSessionUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'CONFIRMED')
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
 * Query hook for SMS-captured drafts awaiting a category
 */
export const usePendingTransactions = () => {
  return useQuery({
    queryKey: ['pending-transactions'],
    queryFn: async (): Promise<TransactionRow[]> => {
      const user = await getSessionUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'PENDING_REVIEW')
        .order('transaction_date', { ascending: false });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
};

/**
 * Infinite query hook for paginated transactions (for history screen)
 * Uses cursor-based pagination with 20 items per page
 * Unfiltered by status, so drafts show up here with a badge
 */
export const useInfiniteTransactions = (filters?: TransactionFilters) => {
  return useInfiniteQuery({
    queryKey: ['transactions-infinite', filters],
    queryFn: async ({
      pageParam,
    }: {
      pageParam?: string;
    }): Promise<{
      transactions: TransactionRow[];
      nextCursor: string | null;
    }> => {
      const user = await getSessionUser();
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

// ---------------------------------------------------------------------------------------------
// Writes: offline-queued
//
// Writes are registered as mutation *defaults* (registerTransactionMutations) rather than inline
// mutationFns, so React Query can persist a write made offline and replay it after a reload.
// Every write shares one scope, so the queue replays strictly in order (add -> edit -> delete).
// Each write also patches cached lists optimistically, so it shows up immediately while offline.
// ---------------------------------------------------------------------------------------------

export const TRANSACTION_MUTATION_KEYS = {
  add: ['transactions', 'add'],
  update: ['transactions', 'update'],
  delete: ['transactions', 'delete'],
} as const;

export const OFFLINE_WRITE_SCOPE = { id: 'offline-writes' };

// Add payload as queued: the id is generated on the client so a replayed insert stays idempotent
export type QueuedNewTransaction = NewTransaction & { id: string };

// confirmsDraft: saving an SMS draft counts as logging a transaction for the streak
export type QueuedUpdateTransaction = UpdateTransaction & { confirmsDraft?: boolean };

type InfinitePage = { transactions: TransactionRow[]; nextCursor: string | null };
type InfiniteTransactions = { pages: InfinitePage[]; pageParams: unknown[] };

/** User id for a write. A saved-but-unrefreshable session (offline) is retryable, not signed out. */
const requireUserIdForWrite = async (): Promise<string> => {
  const user = await getSessionUser();
  if (user) return user.id;
  if (await getPersistedUserId()) throw new RetryableError('Session refresh pending (offline)');
  throw new Error('Not authenticated');
};

const matchesFilters = (row: TransactionRow, filters?: TransactionFilters) => {
  if (!filters) return true;
  if (filters.type && row.type !== filters.type) return false;
  if (filters.category && row.category !== filters.category) return false;
  const date = new Date(row.transaction_date);
  if (filters.year && date.getFullYear() !== filters.year) return false;
  if (filters.month && date.getMonth() + 1 !== filters.month) return false;
  return true;
};

const byDateDesc = (a: TransactionRow, b: TransactionRow) =>
  b.transaction_date.localeCompare(a.transaction_date);

/** Applies `patch` to every cached copy of a row (lists, infinite pages, detail). */
const patchCachedTransactions = (
  queryClient: QueryClient,
  id: string,
  patch: (row: TransactionRow) => TransactionRow | null
) => {
  queryClient.setQueriesData<TransactionRow[]>({ queryKey: ['transactions'] }, (rows) =>
    rows?.flatMap((row) => (row.id === id ? (patch(row) ?? []) : row))
  );
  queryClient.setQueriesData<TransactionRow[]>({ queryKey: ['pending-transactions'] }, (rows) =>
    rows?.flatMap((row) => (row.id === id ? (patch(row) ?? []) : row))
  );
  queryClient.setQueriesData<InfiniteTransactions>(
    { queryKey: ['transactions-infinite'] },
    (data) =>
      data && {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          transactions: page.transactions.flatMap((row) =>
            row.id === id ? (patch(row) ?? []) : row
          ),
        })),
      }
  );
  queryClient.setQueryData<TransactionRow | null>(['transaction', id], (row) =>
    row ? patch(row) : row
  );
};

/** Optimistically shows a new row in every cached list whose filters it matches. */
const insertCachedTransaction = (queryClient: QueryClient, row: TransactionRow) => {
  // Idempotent: a replayed add (after reload) must not duplicate the optimistic row
  patchCachedTransactions(queryClient, row.id, () => null);
  // Lets the not-yet-synced row be opened (view/edit) while offline
  queryClient.setQueryData(['transaction', row.id], row);

  queryClient
    .getQueryCache()
    .findAll({ queryKey: ['transactions'] })
    .forEach((query) => {
      const filters = query.queryKey[1] as TransactionFilters | undefined;
      if (!matchesFilters(row, filters)) return;
      queryClient.setQueryData<TransactionRow[]>(query.queryKey, (rows) =>
        rows ? [row, ...rows].sort(byDateDesc) : rows
      );
    });

  queryClient
    .getQueryCache()
    .findAll({ queryKey: ['transactions-infinite'] })
    .forEach((query) => {
      const filters = query.queryKey[1] as TransactionFilters | undefined;
      if (!matchesFilters(row, filters)) return;
      queryClient.setQueryData<InfiniteTransactions>(query.queryKey, (data) => {
        if (!data?.pages.length) return data;
        const [first, ...rest] = data.pages;
        return {
          ...data,
          pages: [{ ...first, transactions: [row, ...first.transactions].sort(byDateDesc) }, ...rest],
        };
      });
    });
};

const afterWriteSettled = (queryClient: QueryClient) => {
  // Refetches when online; while offline these stay marked stale until the connection returns
  invalidateTransactionQueries(queryClient);
  queryClient.invalidateQueries({ queryKey: ['streak'] });
};

/** Registers the queued transaction writes. Must run before the persisted cache is restored. */
export const registerTransactionMutations = (queryClient: QueryClient) => {
  queryClient.setMutationDefaults(TRANSACTION_MUTATION_KEYS.add, {
    scope: OFFLINE_WRITE_SCOPE,
    mutationFn: async (payload: QueuedNewTransaction): Promise<void> => {
      const userId = await requireUserIdForWrite();
      const { error } = await supabase
        .from('transactions')
        .upsert({ ...payload, user_id: userId }, { onConflict: 'id', ignoreDuplicates: true });
      if (error) throw new Error(error.message);
    },
    onMutate: async (payload: QueuedNewTransaction) => {
      const now = new Date().toISOString();
      insertCachedTransaction(queryClient, {
        id: payload.id,
        amount: payload.amount,
        type: payload.type,
        category: payload.category,
        notes: payload.notes ?? null,
        transaction_date: payload.transaction_date ?? now,
        status: 'CONFIRMED',
        created_at: now,
        updated_at: now,
      } as TransactionRow);
    },
    onSuccess: async () => {
      await updateStreakRemote().catch(() => undefined);
    },
    onSettled: () => afterWriteSettled(queryClient),
  });

  queryClient.setMutationDefaults(TRANSACTION_MUTATION_KEYS.update, {
    scope: OFFLINE_WRITE_SCOPE,
    mutationFn: async ({ id, confirmsDraft: _c, ...payload }: QueuedUpdateTransaction) => {
      const { error } = await supabase
        .from('transactions')
        .update({ ...payload, status: 'CONFIRMED', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ id, confirmsDraft: _c, ...payload }: QueuedUpdateTransaction) => {
      patchCachedTransactions(queryClient, id, (row) => ({
        ...row,
        ...payload,
        notes: payload.notes ?? row.notes,
        status: 'CONFIRMED',
      }));
    },
    onSuccess: async (_data, variables: QueuedUpdateTransaction) => {
      if (variables.confirmsDraft) await updateStreakRemote().catch(() => undefined);
    },
    onSettled: () => afterWriteSettled(queryClient),
  });

  queryClient.setMutationDefaults(TRANSACTION_MUTATION_KEYS.delete, {
    scope: OFFLINE_WRITE_SCOPE,
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onMutate: async (id: string) => {
      patchCachedTransactions(queryClient, id, () => null);
    },
    onSettled: () => afterWriteSettled(queryClient),
  });
};

/** Adds a transaction; queued and shown immediately when offline. Generates the row id. */
export const useAddTransaction = () =>
  useMutation<void, Error, QueuedNewTransaction>({ mutationKey: TRANSACTION_MUTATION_KEYS.add });

/** Updates a transaction (always marks it CONFIRMED); queued when offline. */
export const useUpdateTransaction = () =>
  useMutation<void, Error, QueuedUpdateTransaction>({
    mutationKey: TRANSACTION_MUTATION_KEYS.update,
  });

/** Deletes a transaction; queued when offline. */
export const useDeleteTransaction = () =>
  useMutation<void, Error, string>({ mutationKey: TRANSACTION_MUTATION_KEYS.delete });

/**
 * Query hook to fetch a single transaction by ID
 */
export const useTransaction = (id: string | null) => {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: async (): Promise<TransactionRow | null> => {
      if (!id) return null;

      const { data, error } = await supabase.from('transactions').select('*').eq('id', id).single();

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!id,
  });
};
