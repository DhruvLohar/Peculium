import { useCallback } from 'react';
import { useBottomSheetStore } from '@/store/bottomSheetStore';

export function useBottomSheet<TArgs extends Record<string, unknown> = Record<string, unknown>>(
  id: string,
) {
  const open = useBottomSheetStore((s) => s.open);
  const close = useBottomSheetStore((s) => s.close);
  const entry = useBottomSheetStore((s) => s.sheets[id]);

  const openSheet = useCallback(
    (args?: TArgs) => open(id, args),
    [id, open],
  );

  const closeSheet = useCallback(() => close(id), [id, close]);

  return {
    open: openSheet,
    close: closeSheet,
    isOpen: entry?.isOpen ?? false,
    args: (entry?.args ?? {}) as TArgs,
  };
}
