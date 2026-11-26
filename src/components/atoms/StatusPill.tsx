import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import CustomText from './CustomText';
import { cn } from '@/utils/cn';

export type StatusPillTone = 'offline' | 'syncing' | 'done';

const TONE_CLASS: Record<StatusPillTone, string> = {
  offline: 'bg-zinc-900',
  syncing: 'bg-primary',
  done: 'bg-safe',
};

// Inline, not a text-* class: tailwind-merge can't tell custom color names (text-background) from
// font sizes, so CustomText's merge drops them and the label falls back to text-foreground
const TEXT_COLOR: Record<StatusPillTone, { color: string }> = {
  offline: { color: '#ffffff' },
  syncing: { color: '#000000' },
  done: { color: '#000000' },
};

interface StatusPillProps {
  tone: StatusPillTone;
  label: string;
}

/** Small neo-brutalist status chip. */
const StatusPill: React.FC<StatusPillProps> = ({ tone, label }) => {
  const containerClass = useMemo(
    () => cn('flex-row items-center border-2 border-border px-3 py-1 shadow-sm', TONE_CLASS[tone]),
    [tone]
  );

  return (
    <View className={containerClass}>
      <CustomText className="font-sans-bold text-xs tracking-wide" style={TEXT_COLOR[tone]}>
        {label}
      </CustomText>
    </View>
  );
};

export default memo(StatusPill);
