import React, { memo, useCallback, useEffect } from 'react';
import { Dimensions, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useBottomSheetStore } from '@/store/bottomSheetStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.8,
};

interface FixedBottomSheetProps<TArgs extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  children: (args: TArgs) => React.ReactNode;
  /** Max sheet height as fraction of screen height. Default: 0.6 */
  maxHeight?: number;
}

function FixedBottomSheetInner<TArgs extends Record<string, unknown> = Record<string, unknown>>({
  id,
  children,
  maxHeight = 0.6,
}: FixedBottomSheetProps<TArgs>) {
  const register = useBottomSheetStore((s) => s.register);
  const unregister = useBottomSheetStore((s) => s.unregister);
  const close = useBottomSheetStore((s) => s.close);
  const entry = useBottomSheetStore((s) => s.sheets[id]);

  const isOpen = entry?.isOpen ?? false;
  const args = (entry?.args ?? {}) as TArgs;

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    register(id);
    return () => unregister(id);
  }, [id, register, unregister]);

  useEffect(() => {
    if (isOpen) {
      translateY.value = withSpring(0, SPRING_CONFIG);
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withSpring(SCREEN_HEIGHT, SPRING_CONFIG);
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isOpen, translateY, backdropOpacity]);

  const handleClose = useCallback(() => close(id), [id, close]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: backdropOpacity.value > 0 ? 'auto' : 'none',
  }));

  const sheetHeight = SCREEN_HEIGHT * maxHeight;

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          },
          backdropStyle,
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={handleClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: sheetHeight,
            backgroundColor: 'white',
            borderTopWidth: 3,
            borderLeftWidth: 3,
            borderRightWidth: 3,
            borderColor: 'black',
            zIndex: 100,
          },
          sheetStyle,
        ]}
      >
        {/* Handle */}
        <View className="items-center pt-3 pb-2">
          <View
            style={{
              width: 48,
              height: 5,
              backgroundColor: 'black',
            }}
          />
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {children(args)}
        </View>
      </Animated.View>
    </>
  );
}

// memo-compatible wrapper for generic component
const FixedBottomSheet = memo(FixedBottomSheetInner) as typeof FixedBottomSheetInner;

export default FixedBottomSheet;
