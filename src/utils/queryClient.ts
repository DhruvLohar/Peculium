import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { PersistQueryClientProviderProps } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import supabase from './supabase';
import { isNetworkError } from './network';
import { registerTransactionMutations } from '../hooks/useTransactions';
import { registerBudgetMutations } from '../hooks/useMonthlyBudget';

// Long enough that writes queued during a few days offline still replay
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cached data renders instantly; anything older than this refetches in the background
      staleTime: 30 * 1000,
      // Must be >= persister maxAge or restored queries get garbage-collected right away
      gcTime: ONE_WEEK,
      retry: 2,
    },
    mutations: {
      // Connectivity failures (incl. "online" but unreachable) keep retrying with backoff until the
      // write lands; real server rejections fail immediately. Offline, retries pause and resume
      // automatically when the connection returns.
      retry: (_failureCount, error) => isNetworkError(error),
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30 * 1000),
    },
  },
});

// Writes must be registered before the persisted cache is restored, so queued ones can replay
registerTransactionMutations(queryClient);
registerBudgetMutations(queryClient);

/**
 * Replays writes queued in a previous session. resumePausedMutations() only covers writes that were
 * paused (offline); writes that were mid-retry when the app closed are restored as plain "pending"
 * and need continue(). The shared scope keeps them in their original order.
 */
export const resumeQueuedWrites = () => {
  queryClient
    .getMutationCache()
    .getAll()
    .filter((mutation) => mutation.state.status === 'pending')
    .forEach((mutation) => {
      mutation.continue().catch(() => undefined);
    });
};

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'peculium-query-cache',
  throttleTime: 1000,
});

/**
 * Persists the query cache on-device so the app opens straight onto the last-seen data
 * (stale-while-revalidate), like a native app, instead of spinners on every launch.
 */
export const persistOptions: PersistQueryClientProviderProps['persistOptions'] = {
  persister,
  maxAge: ONE_WEEK,
  // A new app version may change query shapes, so drop caches written by older builds
  buster: Constants.expoConfig?.version ?? '0',
  dehydrateOptions: {
    // Persist every unsent write (paused offline, or mid-retry), not just paused ones
    shouldDehydrateMutation: (mutation) => mutation.state.status === 'pending',
  },
};

// Never let one account's cached data survive into the next sign-in on the same device
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') queryClient.clear();
});
