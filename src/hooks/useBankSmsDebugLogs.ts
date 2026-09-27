import { useEffect } from 'react';
import BankSms, { isBankSmsSupported, type BankSmsDebugLog } from '../../modules/bank-sms';

const LOGGERS: Record<BankSmsDebugLog['level'], (...args: unknown[]) => void> = {
  d: console.log,
  w: console.warn,
  e: console.error,
};

/**
 * Mirrors the native BankSms module's trace (SMS received -> parsed -> enqueued -> notified)
 * to the JS console, so the pipeline can be watched live in the Metro/dev-server terminal
 * instead of needing `adb logcat`.
 */
export const useBankSmsDebugLogs = () => {
  useEffect(() => {
    if (!__DEV__ || !isBankSmsSupported || !BankSms) return;

    const subscription = BankSms.addListener('onDebugLog', (log) => {
      LOGGERS[log.level](`[BankSms] ${log.message}`);
    });

    return () => subscription.remove();
  }, []);
};
