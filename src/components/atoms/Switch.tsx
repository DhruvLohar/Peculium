import React, { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedView = Animated.View;

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const Switch: React.FC<SwitchProps> = ({ value, onValueChange, disabled = false }) => {
  const translateX = useSharedValue(value ? 24 : 0);

  const handlePress = useCallback(() => {
    if (disabled) return;
    const newValue = !value;
    translateX.value = withSpring(newValue ? 24 : 0, {
      damping: 15,
      stiffness: 150,
    });
    onValueChange(newValue);
  }, [value, onValueChange, disabled, translateX]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  React.useEffect(() => {
    translateX.value = withSpring(value ? 24 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [value, translateX]);

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <View
        className={`h-7 w-14 border-2 border-border ${
          value ? 'bg-primary' : 'bg-muted'
        } ${disabled ? 'opacity-50' : ''}`}
        style={{ boxShadow: '2px 2px 0 0 var(--border)' }}>
        <AnimatedView
          className="absolute left-[1px] top-[1px] h-5 w-5 border-2 border-border bg-foreground"
          style={thumbStyle}
        />
      </View>
    </Pressable>
  );
};

export default memo(Switch);
