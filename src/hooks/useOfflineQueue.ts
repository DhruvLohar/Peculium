import { useSyncExternalStore } from 'react';
import { onlineManager, useMutationState } from '@tanstack/react-query';
import { isNetworkError } from '../utils/network';
import { OFFLINE_WRITE_SCOPE } from './useTransactions';

/** React Query's view of connectivity (navigator.onLine + online/offline events on web). */
export const useIsOnline = () =>
  useSyncExternalStore(
    onlineManager.subscribe.bind(onlineManager),
    () => onlineManager.isOnline(),
    () => true
  );

/** Number of writes waiting to reach the server (queued offline or retrying). */
export const usePendingWriteCount = () =>
  useMutationState({
    filters: {
      status: 'pending',
      predicate: (mutation) => mutation.options.scope?.id === OFFLINE_WRITE_SCOPE.id,
    },
  }).length;

interface WriteState {
  isPaused: boolean;
  failureCount: number;
  failureReason: Error | null;
}

/**
 * True once a write has been safely queued instead of sent: paused while offline, or retrying after
 * a connectivity failure. Screens treat that like success and move on; the queue syncs it later.
 */
export const isWriteQueued = ({ isPaused, failureCount, failureReason }: WriteState) =>
  isPaused || (failureCount > 0 && isNetworkError(failureReason));
