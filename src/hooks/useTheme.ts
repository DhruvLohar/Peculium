import { useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';

const THEME_STORAGE_KEY = '@peculium/theme';

type Theme = 'light' | 'dark';

export const useTheme = () => {
  const { setColorScheme, colorScheme } = useColorScheme();

  useEffect(() => {
    const init = async () => {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY).catch(() => null);
      if (stored === 'dark' || stored === 'light') {
        setColorScheme(stored);
      }
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = useCallback(
    async (newTheme: Theme) => {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme).catch(console.error);
      setColorScheme(newTheme);
    },
    [setColorScheme],
  );

  const toggleTheme = useCallback(async () => {
    const next: Theme = colorScheme === 'dark' ? 'light' : 'dark';
    await setTheme(next);
  }, [colorScheme, setTheme]);

  return {
    isDark: colorScheme === 'dark',
    toggleTheme,
    setTheme,
  };
};
