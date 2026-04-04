import React, { memo } from 'react';
import { View } from 'react-native';
import { usePortalStore } from '@/store/portalStore';

// Each slot subscribes only to its own key — no cross-sheet re-renders
const PortalSlot = memo(({ portalKey }: { portalKey: string }) => {
  const node = usePortalStore((s) => s.portals[portalKey]);
  return <>{node}</>;
});

const BottomSheetProvider = memo(({ children }: { children: React.ReactNode }) => {
  const keys = usePortalStore((s) => s.keys);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {keys.map((key) => (
        <PortalSlot key={key} portalKey={key} />
      ))}
    </View>
  );
});

export default BottomSheetProvider;
