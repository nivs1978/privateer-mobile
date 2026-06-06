const CACHE_VERSION = "privateer-v2";
const APP_SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "pwa-192.png",
  "pwa-512.png",
  "favicon.png",
  "favicon.ico",
  "qbasicplayer.js",
  "globals.js",
  "lang.js",
  "resources_da.js",
  "resources_en.js",
  "cgafont.js",
  "help.js",
  "harbor.js",
  "city.js",
  "board.js",
  "shoot.js",
  "promote.js",
  "enemy.js",
  "mist.js",
  "attack.js",
  "kaper.js",
  "player.js",
  "map.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse;
        }

        const responseClone = networkResponse.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, responseClone));
        return networkResponse;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("index.html")))
  );
});
