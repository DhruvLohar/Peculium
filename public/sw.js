/*
 * App-shell service worker: makes repeat launches instant and lets the shell open on a flaky network.
 * Only same-origin GETs are handled; Supabase/API traffic always goes straight to the network
 * (React Query's on-device cache covers data).
 */
// Bump when this file's caching strategy changes; keep SHELL_CACHE in sync with src/utils/appUpdate.ts
const VERSION = 'v2';
const SHELL_CACHE = `peculium-shell-${VERSION}`;
const ASSET_CACHE = `peculium-assets-${VERSION}`;
const MAX_ASSETS = 80;
const NAVIGATION_TIMEOUT_MS = 2500;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(['/', '/manifest.json', '/apple-touch-icon.png']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('peculium-') && key !== SHELL_CACHE && key !== ASSET_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

const trim = async (cacheName, max) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((key) => cache.delete(key)));
};

// Hashed build output never changes under the same URL: cache-first
const isImmutableAsset = (url) =>
  url.pathname.startsWith('/_expo/static/') || url.pathname.startsWith('/assets/');

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Page loads: network-first so a new deploy shows up on the next launch, but fall back to the
  // cached shell after a short wait (or when offline) so launch stays fast on a bad connection.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const network = fetch('/', { cache: 'no-cache' }).then((response) => {
          if (response.ok) cache.put('/', response.clone());
          return response;
        });
        const timeout = new Promise((resolve) => setTimeout(resolve, NAVIGATION_TIMEOUT_MS));
        const cached = cache.match('/');

        const winner = await Promise.race([network.catch(() => null), timeout]);
        if (winner) return winner;
        // Slow or offline: serve the cached shell, keep updating it in the background
        event.waitUntil(network.catch(() => undefined));
        return (await cached) || network;
      })
    );
    return;
  }

  if (isImmutableAsset(url)) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) {
          cache.put(request, response.clone());
          event.waitUntil(trim(ASSET_CACHE, MAX_ASSETS));
        }
        return response;
      })
    );
  }
});
