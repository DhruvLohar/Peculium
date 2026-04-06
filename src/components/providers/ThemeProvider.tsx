import React, { createContext, memo, useContext } from 'react';
import { useTheme } from '@/hooks/useTheme';

type ThemeContextValue = {
  isDark: boolean;
  toggleTheme: () => Promise<void>;
  setTheme: (theme: 'light' | 'dark') => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider');
  return ctx;
};

export default memo(ThemeProvider);
