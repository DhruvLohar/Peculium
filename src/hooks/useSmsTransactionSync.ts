import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import BankSms, { isBankSmsSupported, type BankTransaction } from '../../modules/bank-sms';
import supabase, { getSessionUser } from '../utils/supabase';
import { invalidateTransactionQueries } from './useTransactions';
import type { Database } from '../utils/database.types';

type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];

/** The SMS date combined with the local time the SMS was received. */
const toTransactionDate = (txn: BankTransaction): string => {
  const received = new Date(txn.receivedAt);
  const [year, month, day] = txn.date.split('-').map(Number);
  return new Date(
    year,
    month - 1,
    day,
    received.getHours(),
    received.getMinutes(),
    received.getSeconds()
  ).toISOString();
};

const toDraftRow = (userId: string, txn: BankTransaction): TransactionInsert => ({
  user_id: userId,
  amount: txn.amount,
  type: txn.type,
  transaction_date: toTransactionDate(txn),
  notes: txn.party,
  bank_ref: txn.ref,
  status: 'PENDING_REVIEW',
  category: null,
});

/**
 * Drains the native bank-SMS queue into Supabase as PENDING_REVIEW drafts.
 * Runs on mount, when the app returns to the foreground, and when the native module reports a new SMS.
 * Refs are acknowledged natively only after the upsert succeeds, so nothing is lost while offline.
 */
export const useSmsTransactionSync = (enabled: boolean) => {
  const queryClient = useQueryClient();

  const { mutate: sync } = useMutation({
    // Serialize runs so overlapping triggers don't race
    scope: { id: 'bank-sms-sync' },
    mutationFn: async (): Promise<number> => {
      if (!BankSms) return 0;

      const pending = await BankSms.getPendingTransactions();
      if (__DEV__) console.log('[sms-sync] native queue size:', pending.length);
      if (pending.length === 0) return 0;

      const user = await getSessionUser();
      if (!user) {
        if (__DEV__) console.warn('[sms-sync] aborting drain - no session user');
        throw new Error('Not authenticated');
      }

      const { error } = await supabase.from('transactions').upsert(
        pending.map((txn) => toDraftRow(user.id, txn)),
        { onConflict: 'user_id,bank_ref', ignoreDuplicates: true }
      );
      if (error) throw new Error(error.message);

      await BankSms.acknowledgeTransactions(pending.map((txn) => txn.ref));
      return pending.length;
    },
    onError: (error) => {
      if (__DEV__) console.warn('[sms-sync] drain failed:', error.message);
    },
    onSuccess: (count) => {
      if (__DEV__ && count > 0) console.log('[sms-sync] upserted drafts:', count);
      if (count > 0) invalidateTransactionQueries(queryClient);
    },
  });

  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!enabled || !isBankSmsSupported || !BankSms) return;

    sync();

    const appStateSub = AppState.addEventListener('change', (next) => {
      if (appState.current !== 'active' && next === 'active') sync();
      appState.current = next;
    });
    const smsSub = BankSms.addListener('onTransactionDetected', () => sync());

    return () => {
      appStateSub.remove();
      smsSub.remove();
    };
  }, [enabled, sync]);
};
