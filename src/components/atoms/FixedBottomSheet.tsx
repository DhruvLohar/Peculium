import React, { memo, useCallback, useEffect, useRef } from 'react';
import { Keyboard, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useBottomSheetStore } from '@/store/bottomSheetStore';
import { usePortalStore } from '@/store/portalStore';
import { getThemeColors } from '@/utils/themeColors';
import { useAppDimensions } from '@/hooks/useAppDimensions';


const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.8,
};

interface FixedBottomSheetProps<TArgs extends object = object> {
  id: string;
  children: (args: TArgs) => React.ReactNode;
  /** Max sheet height as fraction of screen height. Default: 0.6 */
  maxHeight?: number;
}

function FixedBottomSheetInner<TArgs extends object = object>({
  id,
  children,
  maxHeight = 0.6,
}: FixedBottomSheetProps<TArgs>) {
  const register = useBottomSheetStore((s) => s.register);
  const unregister = useBottomSheetStore((s) => s.unregister);
  const close = useBottomSheetStore((s) => s.close);
  const entry = useBottomSheetStore((s) => s.sheets[id]);

  const setPortal = usePortalStore((s) => s.setPortal);
  const removePortal = usePortalStore((s) => s.removePortal);

  const isOpen = entry?.isOpen ?? false;
  const args = (entry?.args ?? {}) as TArgs;

  const { colorScheme } = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const bgColor = colorScheme === 'dark' ? '#1c1c1e' : '#ffffff';

  const { height: SCREEN_HEIGHT } = useAppDimensions();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const keyboard = useAnimatedKeyboard();
  // Keeps sheet content clear of the iPhone home indicator
  const { bottom: bottomInset } = useSafeAreaInsets();

  // Register sheet in bottom sheet store on mount
  useEffect(() => {
    register(id);
    return () => {
      unregister(id);
      removePortal(id);
    };
  }, [id, register, unregister, removePortal]);

  // Drive animation when open state changes. Only an actual open -> closed transition may dismiss
  // the keyboard: every screen mounts its (closed) sheets, so dismissing on any other re-run would
  // blur whatever input the user just focused.
  const wasOpenRef = useRef(false);
  const screenHeightRef = useRef(SCREEN_HEIGHT);
  screenHeightRef.current = SCREEN_HEIGHT;
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;

    if (isOpen) {
      translateY.value = withSpring(0, SPRING_CONFIG);
      backdropOpacity.value = withTiming(1, { duration: 200 });
      return;
    }

    if (wasOpen) Keyboard.dismiss();
    translateY.value = withSpring(screenHeightRef.current, SPRING_CONFIG);
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [isOpen, translateY, backdropOpacity]);

  // Keep a closed sheet parked just off-screen when the window height changes (the on-screen
  // keyboard resizes the viewport on web) - without animating or touching focus.
  useEffect(() => {
    if (!wasOpenRef.current) translateY.value = SCREEN_HEIGHT;
  }, [SCREEN_HEIGHT, translateY]);

  const handleClose = useCallback(() => close(id), [id, close]);

  // Stable animated style refs — Reanimated returns same object identity
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    bottom: keyboard.height.value,
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: backdropOpacity.value > 0 ? 'auto' : 'none',
  }));

  const sheetHeight = SCREEN_HEIGHT * maxHeight;

  // Push JSX into the portal host after every render so content stays in sync.
  // Animated.View elements reference shared values owned by this component,
  // which stays mounted — so animations work regardless of where portals render.
  useEffect(() => {
    setPortal(
      id,
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
          ]}>
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
              backgroundColor: bgColor,
              borderTopWidth: 3,
              borderLeftWidth: 3,
              borderRightWidth: 3,
              borderColor: colors.border,
              zIndex: 100,
            },
            sheetStyle,
          ]}>
          {/* Handle */}
          <View className="items-center pb-2 pt-3">
            <View style={{ width: 48, height: 5, backgroundColor: colors.border }} />
          </View>

          {/* Content */}
          <View style={{ flex: 1, paddingBottom: bottomInset }}>{children(args)}</View>
        </Animated.View>
      </>
    );
  });

  // Renders nothing locally — content lives in BottomSheetProvider's portal host
  return null;
}

const FixedBottomSheet = memo(FixedBottomSheetInner) as typeof FixedBottomSheetInner;

export default FixedBottomSheet;
