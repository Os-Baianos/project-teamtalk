// sw.js — service worker do TeamTalk: habilita "Instalar app" e recebe as notificações (push).
// Não guarda nada em cache (o TeamTalk precisa de internet) e deixa toda requisição seguir normalmente.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});

// Chegou uma notificação: mostra com o nome e a foto de quem mandou.
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { titulo: "TeamTalk", corpo: e.data ? e.data.text() : "" }; }
  e.waitUntil((async () => {
    // Com o app aberto e à vista, o tempo real já mostra a mensagem: não precisa avisar de novo.
    const janelas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    if (janelas.some((j) => j.visibilityState === "visible")) return;
    await self.registration.showNotification(d.titulo || "TeamTalk", {
      body: d.corpo || "",
      icon: d.icone || "/icones/icone-192.png",
      badge: "/icones/icone-192.png",
      tag: d.tag,
      renotify: true,
      data: { url: d.url || "/conversas" },
    });
  })());
});

// Tocar na notificação abre (ou traz para a frente) a conversa.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const alvo = new URL((e.notification.data && e.notification.data.url) || "/conversas", self.location.origin).href;
  e.waitUntil((async () => {
    const janelas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const j of janelas) {
      if ("focus" in j) { await j.focus(); if ("navigate" in j) { try { await j.navigate(alvo); } catch { /* outra origem */ } } return; }
    }
    await self.clients.openWindow(alvo);
  })());
});
