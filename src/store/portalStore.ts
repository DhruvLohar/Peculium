import type { ReactNode } from 'react';
import { create } from 'zustand';

interface PortalStore {
  portals: Record<string, ReactNode>;
  keys: string[];
  setPortal: (key: string, node: ReactNode) => void;
  removePortal: (key: string) => void;
}

export const usePortalStore = create<PortalStore>((set) => ({
  portals: {},
  keys: [],

  setPortal: (key, node) =>
    set((state) => ({
      portals: { ...state.portals, [key]: node },
      keys: state.keys.includes(key) ? state.keys : [...state.keys, key],
    })),

  removePortal: (key) =>
    set((state) => {
      const portals = { ...state.portals };
      delete portals[key];
      return {
        portals,
        keys: state.keys.filter((k) => k !== key),
      };
    }),
}));
