import { Platform } from 'react-native';

// Keep in sync with SHELL_CACHE in public/sw.js
const SHELL_CACHE = 'peculium-shell-v2';
const ENTRY_PATTERN = /\/_expo\/static\/js\/web\/entry-[0-9a-f]+\.js/;

const currentEntry = () =>
  Array.from(document.scripts)
    .map((script) => script.src.match(ENTRY_PATTERN)?.[0])
    .find(Boolean);

/**
 * Web only. A home-screen app has no reload button, and the service worker serves the cached shell,
 * so a new deploy wouldn't show up on its own. Compares the live index.html's bundle with the running
 * one; if a newer build is deployed, stores it as the cached shell and reloads into it.
 * Returns true when a reload was started.
 */
export const reloadIfAppUpdated = async (): Promise<boolean> => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;

  try {
    const response = await fetch('/', { cache: 'no-store' });
    if (!response.ok) return false;

    const html = await response.clone().text();
    const latest = html.match(ENTRY_PATTERN)?.[0];
    const running = currentEntry();
    if (!latest || !running || latest === running) return false;

    if ('caches' in window) {
      const cache = await caches.open(SHELL_CACHE);
      await cache.put('/', response);
    }
    window.location.reload();
    return true;
  } catch {
    // Offline or unreachable: nothing to update, the normal data refresh still runs
    return false;
  }
};
