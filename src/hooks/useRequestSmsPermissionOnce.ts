import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BankSms, { isBankSmsSupported } from '../../modules/bank-sms';

const REQUESTED_KEY = 'bank_sms_permission_requested';

/**
 * Prompts for the bank-SMS permission once, the first time the app loads.
 * Whether the user grants or denies it, we never prompt again automatically -
 * from then on, capture is opted into manually via the profile toggle
 * (useBankSmsSettings), which shows the "blocked" message if needed.
 */
export const useRequestSmsPermissionOnce = () => {
  useEffect(() => {
    const bankSms = BankSms;
    if (!isBankSmsSupported || !bankSms) return;

    AsyncStorage.getItem(REQUESTED_KEY).then(async (alreadyRequested) => {
      if (alreadyRequested) return;

      try {
        const current = await bankSms.getPermissionsAsync();
        if (!current.granted) {
          await bankSms.requestPermissionsAsync();
        }
      } catch (error) {
        console.error('Failed to request initial SMS permission:', error);
      } finally {
        await AsyncStorage.setItem(REQUESTED_KEY, 'true');
      }
    });
  }, []);
};
