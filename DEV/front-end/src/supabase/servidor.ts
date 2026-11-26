import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { lerAmbiente } from "./ambiente";

/** Cliente do Supabase para Server Actions e páginas do servidor (sessão em cookies). */
export async function criarClienteServidor() {
  const { url, chave } = lerAmbiente();
  const armazem = await cookies();
  return createServerClient(url, chave, {
    cookies: {
      getAll: () => armazem.getAll(),
      setAll: (lista) => {
        try {
          lista.forEach(({ name, value, options }) => armazem.set(name, value, options));
        } catch {
          // Chamado fora de uma Server Action: o middleware renova a sessão.
        }
      },
    },
  });
}
