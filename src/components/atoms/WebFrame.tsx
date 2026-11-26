import React, { memo } from 'react';
import { Platform, View } from 'react-native';
import { WEB_MAX_WIDTH } from '@/hooks/useAppDimensions';

const FRAME_STYLE = {
  flex: 1,
  width: '100%',
  maxWidth: WEB_MAX_WIDTH,
  alignSelf: 'center',
  overflow: 'hidden',
} as const;

/** Keeps the web build in a phone-width column on wide screens; a no-op on native. */
const WebFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (Platform.OS !== 'web') return <>{children}</>;

  return (
    <View className="flex-1 bg-muted">
      <View className="bg-background" style={FRAME_STYLE}>
        {children}
      </View>
    </View>
  );
};

export default memo(WebFrame);
