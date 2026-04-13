const APP_VERSION = "4.11.0";
const CACHE_NAME = `health-quest-${APP_VERSION}`;
const APP_FILES = [
  "./",
  "./index.html?v=4.11.0",
  "./styles.css?v=4.11.0",
  "./exercise-help.js?v=4.11.0",
  "./app.js?v=4.11.0",
  "./manifest.json?v=4.11.0",
  "./assets/exercises/goblet-squat.mp4",
  "./assets/exercises/goblet-squat.webm",
  "./assets/exercises/dumbbell-bench-press.mp4",
  "./assets/exercises/dumbbell-bench-press.webm",
  "./assets/exercises/incline-push-up.mp4",
  "./assets/exercises/incline-push-up.webm",
  "./assets/exercises/one-arm-dumbbell-row.mp4",
  "./assets/exercises/one-arm-dumbbell-row.webm",
  "./assets/exercises/romanian-deadlift.mp4",
  "./assets/exercises/romanian-deadlift.webm",
  "./assets/exercises/plank.mp4",
  "./assets/exercises/plank.webm",
  "./assets/exercises/dead-bug.mp4",
  "./assets/exercises/dead-bug.webm",
  "./assets/exercises/goblet-squat.svg",
  "./assets/exercises/dumbbell-bench-press.svg",
  "./assets/exercises/incline-push-up.svg",
  "./assets/exercises/one-arm-dumbbell-row.svg",
  "./assets/exercises/romanian-deadlift.svg",
  "./assets/exercises/plank.svg",
  "./assets/exercises/dead-bug.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isAppShellAsset = isSameOrigin && (
    url.pathname.endsWith("/") ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".json")
  );

  if (isAppShellAsset) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || fetch(event.request)))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => cachedResponse || fetch(event.request))
  );
});
