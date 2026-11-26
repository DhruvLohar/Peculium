/*
 * App-shell service worker: makes repeat launches instant and lets the shell open on a flaky network.
 * Only same-origin GETs are handled; Supabase/API traffic always goes straight to the network
 * (React Query's on-device cache covers data).
 */
const VERSION = 'v1';
const SHELL_CACHE = `peculium-shell-${VERSION}`;
const ASSET_CACHE = `peculium-assets-${VERSION}`;
const MAX_ASSETS = 80;

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

  // Page loads: serve the cached shell immediately, refresh it in the background.
  // A new deploy is picked up on the following launch.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cached = await cache.match('/');
        const network = fetch('/', { cache: 'no-cache' })
          .then((response) => {
            if (response.ok) cache.put('/', response.clone());
            return response;
          })
          .catch(() => cached);
        if (cached) {
          event.waitUntil(network);
          return cached;
        }
        return network;
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
