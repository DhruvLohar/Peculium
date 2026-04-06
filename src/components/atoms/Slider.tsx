import React, { memo, useCallback, useMemo } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { cn } from '@/utils/cn';

export interface SliderProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number) => void;
  disabled?: boolean;
  className?: string;
  trackClassName?: string;
  rangeClassName?: string;
  thumbClassName?: string;
}

const Slider: React.FC<SliderProps> = ({
  value: controlledValue,
  defaultValue = 0,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  disabled = false,
  className,
  trackClassName,
  rangeClassName,
  thumbClassName,
}) => {
  const isControlled = controlledValue !== undefined;
  const initialValue = isControlled ? controlledValue : defaultValue;

  const width = useSharedValue(0);
  const position = useSharedValue(0);
  const isDragging = useSharedValue(false);

  React.useEffect(() => {
    if (isControlled && controlledValue !== undefined) {
      const percentage = (controlledValue - min) / (max - min);
      position.value = withSpring(percentage * width.value, {
        damping: 20,
        stiffness: 200,
      });
    }
  }, [controlledValue, min, max, isControlled, position, width]);

  const handleLayoutChange = useCallback(
    (event: LayoutChangeEvent) => {
      const { width: trackWidth } = event.nativeEvent.layout;
      width.value = trackWidth;
      const percentage = (initialValue - min) / (max - min);
      position.value = percentage * trackWidth;
    },
    [width, position, initialValue, min, max],
  );

  const notifyValueChange = useCallback(
    (rawValue: number) => {
      const steppedValue = Math.round(rawValue / step) * step;
      const clampedValue = Math.max(min, Math.min(max, steppedValue));
      onValueChange?.(clampedValue);
    },
    [onValueChange, step, min, max],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!disabled)
        .onStart(() => {
          isDragging.value = true;
        })
        .onUpdate((event) => {
          const newPosition = Math.max(0, Math.min(width.value, event.x));
          position.value = newPosition;
          const percentage = newPosition / width.value;
          const rawValue = min + percentage * (max - min);
          if (onValueChange) {
            runOnJS(notifyValueChange)(rawValue);
          }
        })
        .onEnd(() => {
          isDragging.value = false;
        }),
    [disabled, isDragging, position, width, min, max, notifyValueChange, onValueChange],
  );

  const THUMB_HALF = 12;

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    left: position.value - THUMB_HALF,
  }));

  const rangeAnimatedStyle = useAnimatedStyle(() => ({
    width: position.value,
  }));

  const containerClass = useMemo(
    () => cn('relative w-full py-2', className),
    [className],
  );

  const trackClass = useMemo(
    () =>
      cn(
        'relative w-full bg-muted/20 border-2 border-border',
        disabled && 'opacity-50',
        trackClassName,
      ),
    [disabled, trackClassName],
  );

  const rangeClass = useMemo(
    () => cn('absolute h-full bg-primary', rangeClassName),
    [rangeClassName],
  );

  const thumbClass = useMemo(
    () =>
      cn(
        'absolute -top-2 w-6 h-6 border-2 border-border bg-background shadow-sm',
        disabled && 'opacity-50',
        thumbClassName,
      ),
    [disabled, thumbClassName],
  );

  return (
    <View className={containerClass}>
      <GestureDetector gesture={panGesture}>
        <View className={cn(trackClass, 'h-3')} onLayout={handleLayoutChange}>
          <Animated.View className={cn(rangeClass, 'h-full')} style={rangeAnimatedStyle} />
          <Animated.View className={thumbClass} style={thumbAnimatedStyle} />
        </View>
      </GestureDetector>
    </View>
  );
};

Slider.displayName = 'Slider';

export default memo(Slider);
