import React, { memo, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import CustomText from '@/components/atoms/CustomText';
import Switch from '@/components/atoms/Switch';
import { useBankSmsSettings } from '@/hooks/useBankSmsSettings';
import { getThemeColors } from '@/utils/themeColors';

const SmsCaptureToggle: React.FC = () => {
  const { colorScheme } = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const { isSupported, enabled, notificationsGranted, isLoading, toggle } = useBankSmsSettings();

  const handleToggle = useCallback(
    (value: boolean) => {
      toggle.mutate(value);
    },
    [toggle]
  );

  const description = useMemo(() => {
    if (toggle.error) return toggle.error.message;
    if (!enabled) return 'Draft GPay/UPI transactions from HDFC SMS';
    if (!notificationsGranted) return 'On · notifications are off, check the dashboard for drafts';
    return 'On · new HDFC transactions are drafted for review';
  }, [toggle.error, enabled, notificationsGranted]);

  const cardStyle = useMemo(() => ({ boxShadow: `3px 3px 0 0 ${colors.border}` }), [colors.border]);

  if (!isSupported) return null;

  return (
    <View
      className="flex-row items-center justify-between border-2 border-border bg-card p-4"
      style={cardStyle}>
      <View className="mr-4 flex-1">
        <CustomText variant="p">Auto-capture HDFC SMS</CustomText>
        <CustomText
          variant="muted"
          className={toggle.error ? 'mt-0.5 text-xs text-destructive' : 'mt-0.5 text-xs'}>
          {description}
        </CustomText>
      </View>
      <Switch
        value={enabled}
        onValueChange={handleToggle}
        disabled={isLoading || toggle.isPending}
      />
    </View>
  );
};

export default memo(SmsCaptureToggle);
