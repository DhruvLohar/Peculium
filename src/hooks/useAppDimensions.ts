import { useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

/** On web the app renders in a centered phone-width column (see atoms/WebFrame). */
export const WEB_MAX_WIDTH = 480;

/**
 * Live app dimensions. Use instead of Dimensions.get('window') at module scope,
 * which is read once and goes stale on web (resizes, rotation, desktop browsers).
 */
export const useAppDimensions = () => {
  const { width, height } = useWindowDimensions();

  return useMemo(
    () => ({
      width: Platform.OS === 'web' ? Math.min(width, WEB_MAX_WIDTH) : width,
      height,
    }),
    [width, height]
  );
};
