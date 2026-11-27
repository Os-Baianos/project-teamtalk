"use client";

import { useEffect } from "react";

/** Registra o service worker mínimo que habilita "Instalar app" no celular. */
export function RegistrarSw() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
