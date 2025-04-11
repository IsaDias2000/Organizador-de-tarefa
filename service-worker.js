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
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Remove caches antigos ao ativar novo service worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Atende as requisições com cache primeiro, depois rede
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Sincronização em segundo plano
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-dados") {
    event.waitUntil(syncData());
  }
});

// Simulação de função de sincronização futura
async function syncData() {
  console.log("🔄 Sincronizando dados com o servidor...");
  // Aqui você pode adicionar integração futura com uma API
}
function updateTransactions() {
  transactionsList.innerHTML = "";
  transactions.forEach((t, i) => {
    const li = document.createElement("li");
    li.textContent = `${t.desc}: R$ ${t.value.toFixed(2)} (${t.cat})${t.installments > 1 ? ` - ${t.installments}x` : ""}`;

    const del = document.createElement("button");
    del.textContent = "🗑️";
    del.onclick = () => {
      transactions.splice(i, 1);
      localStorage.setItem("transactions", JSON.stringify(transactions));
      updateTransactions();
      updateCashflow();
      updatePaymentInfo();
      renderCharts();
    };

    li.appendChild(del);
    transactionsList.appendChild(li);
  });
}
