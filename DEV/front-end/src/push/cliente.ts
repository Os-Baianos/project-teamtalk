"use client";

/** Chave do aparelho guardada para o logout apagar o registro dele (localStorage não é limpo ao sair). */
export const CHAVE_ENDPOINT = "tt-push-endpoint";

export function suportaPush(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function chaveParaBytes(base64: string): Uint8Array<ArrayBuffer> {
  const preenchida = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const bruto = atob(preenchida);
  const saida = new Uint8Array(new ArrayBuffer(bruto.length));
  for (let i = 0; i < bruto.length; i++) saida[i] = bruto.charCodeAt(i);
  return saida;
}

export function guardarEndpoint(endpoint: string | null) {
  try { if (endpoint) localStorage.setItem(CHAVE_ENDPOINT, endpoint); else localStorage.removeItem(CHAVE_ENDPOINT); } catch { /* sem armazenamento */ }
}
