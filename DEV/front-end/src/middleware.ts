import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { NOME_COOKIE_SESSAO, ROTAS_PUBLICAS } from "./sessao/constantes";

/** Protege as páginas internas: sem sessão volta ao login; com sessão, login e cadastro levam aos contatos. */
export function middleware(requisicao: NextRequest) {
  const { pathname } = requisicao.nextUrl;
  const logado = Boolean(requisicao.cookies.get(NOME_COOKIE_SESSAO)?.value);
  const publica = ROTAS_PUBLICAS.includes(pathname);

  if (!logado && !publica) {
    const destino = new URL("/login", requisicao.url);
    if (pathname !== "/") destino.searchParams.set("aviso", "entre");
    return NextResponse.redirect(destino);
  }
  if (logado && (publica || pathname === "/")) {
    return NextResponse.redirect(new URL("/contatos", requisicao.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico|css|js)$).*)"],
};
