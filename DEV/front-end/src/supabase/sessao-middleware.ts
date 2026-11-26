import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { lerAmbiente } from "./ambiente";

/** Renova a sessão do Supabase a cada requisição e informa se há usuário logado. */
export async function atualizarSessao(requisicao: NextRequest) {
  const { url, chave } = lerAmbiente();
  let resposta = NextResponse.next({ request: requisicao });

  const supabase = createServerClient(url, chave, {
    cookies: {
      getAll: () => requisicao.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => requisicao.cookies.set(name, value));
        resposta = NextResponse.next({ request: requisicao });
        lista.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  return { resposta, logado: Boolean(data.user) };
}
