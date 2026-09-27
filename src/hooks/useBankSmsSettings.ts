import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import BankSms, {
  isBankSmsSupported,
  type BankSmsPermissionResponse,
} from '../../modules/bank-sms';

export interface BankSmsSettings {
  enabled: boolean;
  permission: BankSmsPermissionResponse | null;
}

const SETTINGS_KEY = ['bank-sms-settings'];

/**
 * Reads and toggles native bank-SMS capture. Turning it on requests RECEIVE_SMS
 * (and POST_NOTIFICATIONS on Android 13+) first; capture is only enabled if SMS access is granted.
 */
export const useBankSmsSettings = () => {
  const queryClient = useQueryClient();

  const settings = useQuery({
    queryKey: SETTINGS_KEY,
    enabled: isBankSmsSupported,
    queryFn: async (): Promise<BankSmsSettings> => {
      if (!BankSms) return { enabled: false, permission: null };
      const [enabled, permission] = await Promise.all([
        BankSms.isEnabled(),
        BankSms.getPermissionsAsync(),
      ]);
      // Permission revoked from system settings → treat capture as off
      return { enabled: enabled && permission.granted, permission };
    },
  });

  const toggle = useMutation({
    mutationFn: async (nextEnabled: boolean): Promise<BankSmsSettings> => {
      if (!BankSms) throw new Error('SMS capture is only available on Android');

      if (!nextEnabled) {
        await BankSms.setEnabled(false);
        return { enabled: false, permission: settings.data?.permission ?? null };
      }

      const permission = await BankSms.requestPermissionsAsync();
      if (!permission.granted) {
        await BankSms.setEnabled(false);
        throw new Error(
          permission.canAskAgain
            ? 'SMS permission is required to capture bank transactions'
            : 'SMS permission is blocked. Enable it from App info → Permissions (sideloaded builds may need "Allow restricted settings" first)'
        );
      }

      await BankSms.setEnabled(true);
      return { enabled: true, permission };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(SETTINGS_KEY, data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
    },
  });

  return {
    isSupported: isBankSmsSupported,
    enabled: settings.data?.enabled ?? false,
    notificationsGranted: settings.data?.permission?.notificationsGranted ?? false,
    isLoading: settings.isLoading,
    refetch: settings.refetch,
    toggle,
  };
};
