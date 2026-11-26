import { createBrowserClient } from "@supabase/ssr";
import { lerAmbiente } from "./ambiente";

/** Cliente do Supabase para o navegador (usado no tempo real das mensagens). */
export function criarClienteNavegador() {
  const { url, chave } = lerAmbiente();
  return createBrowserClient(url, chave);
}
