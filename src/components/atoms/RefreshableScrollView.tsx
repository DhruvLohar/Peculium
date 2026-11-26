import React, { memo, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  View,
  type ScrollViewProps,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PULL_THRESHOLD, useWebPullToRefresh } from '@/hooks/useWebPullToRefresh';

interface RefreshableScrollViewProps extends Omit<ScrollViewProps, 'refreshControl'> {
  refreshing: boolean;
  onRefresh: () => void;
  /** Spinner color. */
  tintColor?: string;
  className?: string;
}

const INDICATOR_SIZE = 40;

/**
 * ScrollView with pull-to-refresh on every platform: native RefreshControl on iOS/Android, and a
 * touch-driven equivalent on web (where RefreshControl is a no-op). On web a pull also picks up a
 * newly deployed version of the app.
 */
const RefreshableScrollView: React.FC<RefreshableScrollViewProps> = ({
  refreshing,
  onRefresh,
  tintColor = '#000000',
  children,
  ...scrollProps
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const { enabled, pull, isSpinning } = useWebPullToRefresh(scrollRef, onRefresh, refreshing);

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

  const indicatorStyle = useMemo(() => {
    const progress = Math.min(1, pull / PULL_THRESHOLD);
    return {
      position: 'absolute' as const,
      top: pull - INDICATOR_SIZE,
      // Explicit centering: browsers ignore alignSelf on absolutely positioned elements
      left: '50%' as const,
      marginLeft: -INDICATOR_SIZE / 2,
      width: INDICATOR_SIZE,
      height: INDICATOR_SIZE,
      opacity: isSpinning ? 1 : progress,
      transform: [{ rotate: `${progress * 270}deg` }],
      zIndex: 20,
    };
  }, [pull, isSpinning]);

  return (
    <View className="flex-1">
      <ScrollView ref={scrollRef} refreshControl={refreshControl} {...scrollProps}>
        {children}
      </ScrollView>

      {enabled && (pull > 0 || isSpinning) && (
        <View
          pointerEvents="none"
          style={indicatorStyle}
          className="items-center justify-center border-2 border-border bg-primary shadow-sm">
          {isSpinning ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <MaterialIcons name="refresh" size={22} color="#000000" />
          )}
        </View>
      )}
    </View>
  );
};

export default memo(RefreshableScrollView);
