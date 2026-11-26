import { useEffect } from 'react';
import { Platform } from 'react-native';

// Keep in sync with --background in global.css and the inline script in public/index.html
const BACKGROUND = { light: '#ffffff', dark: '#1a1a1a' } as const;

/**
 * Web only: Safari tints its status bar area, toolbars and overscroll from <meta name="theme-color">
 * and the page background, not from the app's own views. Mirror the active theme onto both.
 */
export const useWebBrowserChrome = (isDark: boolean) => {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const color = isDark ? BACKGROUND.dark : BACKGROUND.light;
    const root = document.documentElement;

    root.style.backgroundColor = color;
    root.style.colorScheme = isDark ? 'dark' : 'light';
    document.body.style.backgroundColor = color;

    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = color;
  }, [isDark]);
};
