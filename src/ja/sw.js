const CACHE_NAME = "2023-08-13 09:30";
const urlsToCache = [
  "/world-map-puzzle/",
  "/world-map-puzzle/ja/",
  "/world-map-puzzle/index.js",
  "/world-map-puzzle/map.svg",
  "/world-map-puzzle/data/ja.lst",
  "/world-map-puzzle/mp3/decision50.mp3",
  "/world-map-puzzle/mp3/correct1.mp3",
  "/world-map-puzzle/mp3/correct3.mp3",
  "/world-map-puzzle/favicon/favicon.svg",
  "https://cdn.jsdelivr.net/npm/fabric@5.3.0/dist/fabric.min.js",
  "https://cdn.jsdelivr.net/npm/svgpath@2.6.0/+esm",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      );
    }),
  );
});
