import { Pressable, TextInput } from 'react-native';
import Animated from 'react-native-reanimated';
import { cssInterop } from 'nativewind';

/**
 * Reanimated components registered with NativeWind.
 * Without cssInterop, `className` on an animated component is dropped on web
 * (react-native-web ignores it), so borders, backgrounds and padding vanish.
 * Always use these instead of calling Animated.createAnimatedComponent in a component file.
 */
export const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
export const AnimatedView = Animated.View;

cssInterop(AnimatedPressable, { className: 'style' });
cssInterop(AnimatedTextInput, { className: 'style' });
cssInterop(AnimatedView, { className: 'style' });
