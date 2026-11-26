import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { atualizarSessao } from "./supabase/sessao-middleware";
import { ROTAS_PUBLICAS } from "./sessao/constantes";

/** Protege as páginas internas: sem sessão volta ao login; com sessão, login e cadastro levam aos contatos. */
export async function middleware(requisicao: NextRequest) {
  const { pathname } = requisicao.nextUrl;
  const { resposta, logado } = await atualizarSessao(requisicao);
  const publica = ROTAS_PUBLICAS.includes(pathname);

  const redirecionar = (destino: URL) => {
    const r = NextResponse.redirect(destino);
    resposta.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  };

  if (!logado && !publica) {
    const destino = new URL("/login", requisicao.url);
    if (pathname !== "/") destino.searchParams.set("aviso", "entre");
    return redirecionar(destino);
  }
  if (logado && (publica || pathname === "/")) {
    return redirecionar(new URL("/contatos", requisicao.url));
  }
  return resposta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico|css|js)$).*)"],
};
