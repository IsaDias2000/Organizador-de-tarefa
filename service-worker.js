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

// Instala e armazena os arquivos no cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

// Remove caches antigos
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

// Atende as requisições usando o cache primeiro
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

// Sincronização em segundo plano
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-dados") {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log("🔄 Simulando sincronização offline com servidor...");
  // Aqui você poderia implementar integração com API futuramente
}
const CACHE_NAME = 'finance-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
