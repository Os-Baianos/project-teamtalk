"use client";

import { criarClienteNavegador } from "./navegador";

/** Id de quem está logado, lido da sessão do navegador (sem ir ao servidor). */
export async function meuIdLocal(): Promise<string | null> {
  const { data } = await criarClienteNavegador().auth.getSession();
  return data.session?.user.id ?? null;
}
