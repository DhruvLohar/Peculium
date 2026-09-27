import { Platform } from 'react-native';
import {
  requireOptionalNativeModule,
  type EventSubscription,
  type PermissionResponse,
} from 'expo-modules-core';

export type BankTransactionType = 'INCOME' | 'EXPENSE';

export interface BankTransaction {
  ref: string;
  amount: number;
  type: BankTransactionType;
  /** yyyy-MM-dd, from the SMS */
  date: string;
  /** Payee (debit) or payer VPA (credit) */
  party: string;
  accountLast4: string;
  /** Epoch millis the SMS was received */
  receivedAt: number;
}

/** status/granted reflect RECEIVE_SMS; notification permission is reported separately. */
export type BankSmsPermissionResponse = PermissionResponse & {
  notificationsGranted: boolean;
};

export interface BankSmsDebugLog {
  level: 'd' | 'w' | 'e';
  message: string;
}

type BankSmsEvents = {
  onTransactionDetected: (txn: BankTransaction) => void;
  onDebugLog: (log: BankSmsDebugLog) => void;
};

interface BankSmsModuleType {
  getPendingTransactions(): Promise<BankTransaction[]>;
  acknowledgeTransactions(refs: string[]): Promise<void>;
  setEnabled(enabled: boolean): Promise<void>;
  isEnabled(): Promise<boolean>;
  requestPermissionsAsync(): Promise<BankSmsPermissionResponse>;
  getPermissionsAsync(): Promise<BankSmsPermissionResponse>;
  parseSms(body: string): BankTransaction | null;
  addListener<K extends keyof BankSmsEvents>(
    event: K,
    listener: BankSmsEvents[K]
  ): EventSubscription;
}

// Optional so a build without the native module (Expo Go, stale dev client) degrades instead of crashing
const BankSms: BankSmsModuleType | null =
  Platform.OS === 'android' ? requireOptionalNativeModule<BankSmsModuleType>('BankSms') : null;

export const isBankSmsSupported = BankSms != null;

export default BankSms;
