import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatusPill, { type StatusPillTone } from '@/components/atoms/StatusPill';
import { useIsOnline, usePendingWriteCount } from '@/hooks/useOfflineQueue';

const SYNCED_FLASH_MS = 2000;

const plural = (n: number) => `${n} change${n === 1 ? '' : 's'}`;

/**
 * Floating pill that surfaces the offline write queue:
 * "Offline" / "Offline · 2 changes saved" -> "Syncing 2 changes…" -> "All changes synced" (briefly).
 * Renders nothing when online with an empty queue.
 */
const SyncStatusIndicator: React.FC = () => {
  const isOnline = useIsOnline();
  const pending = usePendingWriteCount();
  const { top } = useSafeAreaInsets();

  const [justSynced, setJustSynced] = useState(false);
  const hadPending = useRef(false);

  useEffect(() => {
    if (pending > 0) {
      hadPending.current = true;
      setJustSynced(false);
      return;
    }
    if (!hadPending.current || !isOnline) return;
    hadPending.current = false;
    setJustSynced(true);
    const timer = setTimeout(() => setJustSynced(false), SYNCED_FLASH_MS);
    return () => clearTimeout(timer);
  }, [pending, isOnline]);

  const status = useMemo((): { tone: StatusPillTone; label: string } | null => {
    if (!isOnline) {
      return {
        tone: 'offline',
        label: pending > 0 ? `Offline · ${plural(pending)} saved` : 'Offline',
      };
    }
    if (pending > 0) return { tone: 'syncing', label: `Syncing ${plural(pending)}…` };
    if (justSynced) return { tone: 'done', label: 'All changes synced' };
    return null;
  }, [isOnline, pending, justSynced]);

  const containerStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      top: top + 8,
      left: 0,
      right: 0,
      alignItems: 'center' as const,
      zIndex: 60,
    }),
    [top]
  );

  if (!status) return null;

  return (
    <View pointerEvents="none" style={containerStyle}>
      <StatusPill tone={status.tone} label={status.label} />
    </View>
  );
};

export default memo(SyncStatusIndicator);
