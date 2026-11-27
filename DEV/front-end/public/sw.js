// sw.js — service worker mínimo: só existe para o navegador oferecer "Instalar app".
// Não guarda nada em cache (o TeamTalk precisa de internet) e deixa toda requisição seguir normalmente.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
