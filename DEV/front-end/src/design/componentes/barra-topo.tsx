"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sairAction } from "../../sessao/acoes";
import { souDevAction } from "../../dev/acoes";
import estilos from "@design/componentes/barra-topo.module.css";

const itens = [
  { href: "/contatos", rotulo: "Contatos" },
];

const rotasPublicas = ["/login", "/cadastro"];

/** Barra superior do TeamTalk: marca na primeira linha e navegação na segunda (somente logado). */
export function BarraTopo() {
  const caminho = usePathname();
  const publica = rotasPublicas.includes(caminho);
  const menu = useRef<HTMLDetailsElement>(null);
  const [dev, setDev] = useState(false);

  // Só contas dev veem o Painel dev (a permissão de verdade fica no banco).
  useEffect(() => {
    if (publica) { setDev(false); return; }
    souDevAction().then(setDev);
  }, [publica]);

  // Fecha o menu Conta ao clicar fora, apertar Esc ou trocar de página.
  useEffect(() => {
    const fechar = () => menu.current?.removeAttribute("open");
    const aoClicar = (e: MouseEvent) => {
      if (menu.current && !menu.current.contains(e.target as Node)) fechar();
    };
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === "Escape") fechar(); };
    document.addEventListener("mousedown", aoClicar);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicar);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, []);

  useEffect(() => { menu.current?.removeAttribute("open"); }, [caminho]);

  return (
    <header className={estilos.topo}>
      <div className={estilos.linha}>
        <Link href="/" className={estilos.marca} aria-label="TeamTalk, página inicial">
          <svg className={estilos.simbolo} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
            <path d="M6 3h20a4 4 0 0 1 4 4v13a4 4 0 0 1-4 4H14l-6.2 5.1a.8.8 0 0 1-1.3-.6V24H6a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z" fill="currentColor" />
            <path d="M10.5 9h11v2.8h-4.1V20h-2.8v-8.2h-4.1Z" fill="var(--cor-topo)" />
          </svg>
          <span className={estilos.nome}>Team<span className={estilos.destaque}>Talk</span></span>
        </Link>
      </div>
      {!publica && (
        <div className={estilos.linha}>
          <nav className={estilos.nav} aria-label="Principal">
            {itens.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={estilos.item}
                aria-current={caminho.startsWith(item.href) ? "page" : undefined}
              >
                {item.rotulo}
              </Link>
            ))}
            <details className={estilos.menu} ref={menu}>
              <summary className={estilos.item}>
                Conta <span className={estilos.seta} aria-hidden="true" />
              </summary>
              <div className={estilos.suspenso}>
                <Link href="/perfil" className={estilos.opcao}>Perfil</Link>
                {dev && <Link href="/dev" className={estilos.opcao}>Painel dev</Link>}
                <form action={sairAction}>
                  <button type="submit" className={estilos.opcao}>Sair</button>
                </form>
              </div>
            </details>
          </nav>
        </div>
      )}
    </header>
  );
}

export function RodapeTopo() {
  return <footer className={estilos.rodape}>© 2026 TeamTalk. Chat corporativo interno.</footer>;
}
