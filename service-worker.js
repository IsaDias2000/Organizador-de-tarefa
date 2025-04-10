const CACHE_NAME = "gestao-financeira-v2";
const FILES_TO_CACHE = [
  "/Organizador-de-tarefa/",
  "/Organizador-de-tarefa/index.html",
  "/Organizador-de-tarefa/style.css",
  "/Organizador-de-tarefa/script.js",
  "/Organizador-de-tarefa/manifest.json",
  "/Organizador-de-tarefa/icons/icon-192.png",
  "/Organizador-de-tarefa/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

// Background sync
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-transactions") {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log("🔄 Sincronizando dados offline...");
  // Aqui você pode implementar lógica de sincronização com API futuramente
}
