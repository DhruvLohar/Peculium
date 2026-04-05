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
  const position = useSharedValue(
    ((initialValue - min) / (max - min)) * width.value,
  );
  const isDragging = useSharedValue(false);

  // Update position when controlled value changes
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

      // Set initial position
      const percentage = (initialValue - min) / (max - min);
      position.value = percentage * trackWidth;
    },
    [width, position, initialValue, min, max],
  );

  const notifyValueChange = useCallback(
    (rawValue: number) => {
      // Apply step rounding
      const steppedValue = Math.round(rawValue / step) * step;
      // Clamp to min/max
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

          // Calculate value
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

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    const scale = isDragging.value ? 1.2 : 1;
    return {
      transform: [
        { translateX: position.value },
        { scale: withSpring(scale, { damping: 15, stiffness: 300 }) },
      ],
    };
  });

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
        'relative h-3 w-full overflow-hidden bg-muted/20 border-2 border-black',
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
        'absolute h-6 w-6 -ml-3 -mt-1.5 border-2 border-black bg-background',
        'shadow-[2px_2px_0px_0px_#000]',
        disabled && 'opacity-50',
        thumbClassName,
      ),
    [disabled, thumbClassName],
  );

  return (
    <View className={containerClass}>
      <GestureDetector gesture={panGesture}>
        <View className="relative w-full touch-none select-none flex items-center">
          <View className={trackClass} onLayout={handleLayoutChange}>
            <Animated.View className={rangeClass} style={rangeAnimatedStyle} />
          </View>
          <Animated.View className={thumbClass} style={thumbAnimatedStyle} />
        </View>
      </GestureDetector>
    </View>
  );
};

Slider.displayName = 'Slider';

export default memo(Slider);
