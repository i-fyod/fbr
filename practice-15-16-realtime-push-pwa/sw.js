/* eslint-disable no-restricted-globals */

const CACHE_NAME = "todo-pwa-v2";

const ASSETS = [
  "./",
  "./index.html",
  "./about.html",
  "./styles.css",
  "./app.js",
  "./offline.html",
  "./manifest.json",
  "./assets/icons/icon-96.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Network First for HTML navigations (dynamic pages) with cache fallback
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match("./offline.html") || caches.match("./index.html"))
        )
    );
    return;
  }

  // Cache-first for same-origin static
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => cached);
    })
  );
});

self.addEventListener("push", (event) => {
  const data = (() => {
    try {
      return event.data?.json();
    } catch {
      return null;
    }
  })();

  const title = data?.title || "Уведомление";
  const options = {
    body: data?.body || "",
    icon: "./assets/icons/icon-192.png",
    data: { url: data?.url || "./index.html" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "./index.html";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientsArr) => {
        for (const client of clientsArr) {
          if (client.url.includes(url)) return client.focus();
        }
        return self.clients.openWindow(url);
      })
  );
});
