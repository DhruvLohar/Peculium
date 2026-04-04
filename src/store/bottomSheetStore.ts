import { create } from 'zustand';

export interface BottomSheetEntry {
  isOpen: boolean;
  args: Record<string, unknown>;
}

interface BottomSheetStore {
  sheets: Record<string, BottomSheetEntry>;
  open: (id: string, args?: Record<string, unknown>) => void;
  close: (id: string) => void;
  register: (id: string) => void;
  unregister: (id: string) => void;
}

export const useBottomSheetStore = create<BottomSheetStore>((set) => ({
  sheets: {},

  register: (id) =>
    set((state) => ({
      sheets: {
        ...state.sheets,
        [id]: state.sheets[id] ?? { isOpen: false, args: {} },
      },
    })),

  unregister: (id) =>
    set((state) => {
      const next = { ...state.sheets };
      delete next[id];
      return { sheets: next };
    }),

  open: (id, args = {}) =>
    set((state) => ({
      sheets: {
        ...state.sheets,
        [id]: { isOpen: true, args },
      },
    })),

  close: (id) =>
    set((state) => ({
      sheets: {
        ...state.sheets,
        [id]: { ...state.sheets[id], isOpen: false },
      },
    })),
}));
