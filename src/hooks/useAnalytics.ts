import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import supabase from '@/utils/supabase';
import type { Enums } from '@/utils/database.types';
import type { TransactionCategory, TransactionType } from '@/hooks/useTransactions';

type AppEventType = Enums<'app_event_type'>;

// ─── Per-event payload types ────────────────────────────────────────────────

type EventDataMap = {
  AppOpened: { platform: string; app_version: string };
  ContinuedToLogin: { email: string };
  SkippedToLogin: Record<string, never>;
  AddTransaction: { type: TransactionType; category: TransactionCategory; amount: number };
  EditTransaction: { transaction_id: string; type: TransactionType; category: TransactionCategory; amount: number };
  DeleteTransaction: { transaction_id: string };
  UpdateMonthlyBudget: { amount: number; month_year: string };
  ProfileViewed: Record<string, never>;
  ToggledTheme: { theme: 'light' | 'dark' };
};

// ─── Core insert ─────────────────────────────────────────────────────────────

async function insertEvent<E extends AppEventType>(
  event: E,
  event_data: EventDataMap[E],
): Promise<void> {
  const [device_id, { data: { user } }] = await Promise.all([
    AsyncStorage.getItem('device_id'),
    supabase.auth.getUser(),
  ]);

  await supabase.from('analytics_events').insert({
    event,
    event_data,
    device_id,
    user_id: user?.id ?? null,
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAnalytics = () => {
  const trackAppOpened = useCallback((data: EventDataMap['AppOpened']) => {
    void insertEvent('AppOpened', data);
  }, []);

  const trackContinuedToLogin = useCallback((email: string) => {
    void insertEvent('ContinuedToLogin', { email });
  }, []);

  const trackSkippedToLogin = useCallback(() => {
    void insertEvent('SkippedToLogin', {});
  }, []);

  const trackAddTransaction = useCallback(
    (data: EventDataMap['AddTransaction']) => {
      void insertEvent('AddTransaction', data);
    },
    [],
  );

  const trackEditTransaction = useCallback(
    (data: EventDataMap['EditTransaction']) => {
      void insertEvent('EditTransaction', data);
    },
    [],
  );

  const trackDeleteTransaction = useCallback((transaction_id: string) => {
    void insertEvent('DeleteTransaction', { transaction_id });
  }, []);

  const trackUpdateMonthlyBudget = useCallback(
    (data: EventDataMap['UpdateMonthlyBudget']) => {
      void insertEvent('UpdateMonthlyBudget', data);
    },
    [],
  );

  const trackProfileViewed = useCallback(() => {
    void insertEvent('ProfileViewed', {});
  }, []);

  const trackToggledTheme = useCallback((theme: 'light' | 'dark') => {
    void insertEvent('ToggledTheme', { theme });
  }, []);

  return {
    trackAppOpened,
    trackContinuedToLogin,
    trackSkippedToLogin,
    trackAddTransaction,
    trackEditTransaction,
    trackDeleteTransaction,
    trackUpdateMonthlyBudget,
    trackProfileViewed,
    trackToggledTheme,
  };
};
