import React, { memo, useMemo, useRef } from 'react';
import { RefreshControl, ScrollView, View, type ScrollViewProps } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import CustomText from './CustomText';
import Loader from './Loader';
import { REFRESH_HOLD, useWebPullToRefresh, type PullPhase } from '@/hooks/useWebPullToRefresh';

interface RefreshableScrollViewProps extends Omit<ScrollViewProps, 'refreshControl'> {
  refreshing: boolean;
  onRefresh: () => void;
  /** Native spinner color. */
  tintColor?: string;
  className?: string;
}

// Matches Container's horizontal padding so the band spans the full screen width
const SCREEN_GUTTER = 16;
const BAND_COLOR = '#ffdb33';
const INK = '#000000';

const LABELS: Record<Exclude<PullPhase, 'idle'>, string> = {
  pulling: 'Pull to refresh',
  armed: 'Release to refresh',
  refreshing: 'Loading',
};

const BAND_STYLE = {
  position: 'absolute' as const,
  top: 0,
  left: -SCREEN_GUTTER,
  right: -SCREEN_GUTTER,
  height: 0,
  overflow: 'hidden' as const,
  backgroundColor: BAND_COLOR,
  // Width is set while pulling (useWebPullToRefresh); 0 at rest so no line shows at the top
  borderBottomWidth: 0,
  borderColor: INK,
  justifyContent: 'flex-end' as const,
  alignItems: 'center' as const,
};

const LABEL_ROW_STYLE = {
  height: REFRESH_HOLD,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 8,
};

const LABEL_STYLE = { color: INK };

/**
 * ScrollView with pull-to-refresh on every platform: native RefreshControl on iOS/Android; on web
 * (where RefreshControl is a no-op) the whole page drags down to reveal a yellow band that reads
 * "Pull to refresh" -> "Release to refresh" -> "Loading". A web pull also picks up new deploys.
 */
const RefreshableScrollView: React.FC<RefreshableScrollViewProps> = ({
  refreshing,
  onRefresh,
  tintColor = INK,
  children,
  ...scrollProps
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const bandRef = useRef<View>(null);
  const { enabled, phase } = useWebPullToRefresh(scrollRef, bandRef, onRefresh, refreshing);

  const refreshControl = useMemo(
    () =>
      enabled ? undefined : (
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={tintColor}
          colors={[tintColor]}
        />
      ),
    [enabled, refreshing, onRefresh, tintColor]
  );

  return (
    <View className="flex-1">
      {enabled && (
        <View ref={bandRef} pointerEvents="none" style={BAND_STYLE}>
          {phase !== 'idle' && (
            <View style={LABEL_ROW_STYLE}>
              {phase === 'refreshing' ? (
                <Loader size="sm" variant="secondary" />
              ) : (
                <MaterialIcons
                  name={phase === 'armed' ? 'arrow-upward' : 'arrow-downward'}
                  size={16}
                  color={INK}
                />
              )}
              <CustomText
                className="font-sans-bold text-xs uppercase tracking-widest"
                style={LABEL_STYLE}>
                {LABELS[phase]}
              </CustomText>
            </View>
          )}
        </View>
      )}
      <ScrollView ref={scrollRef} refreshControl={refreshControl} {...scrollProps}>
        {children}
      </ScrollView>
    </View>
  );
};

export default memo(RefreshableScrollView);
