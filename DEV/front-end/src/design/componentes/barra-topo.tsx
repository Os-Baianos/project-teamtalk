"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import estilos from "@design/componentes/barra-topo.module.css";

const itens = [
  { href: "/contatos", rotulo: "Contatos" },
];

const rotasPublicas = ["/login", "/cadastro"];

/** Barra superior do TeamTalk: marca na primeira linha e navegação na segunda (somente logado). */
export function BarraTopo() {
  const caminho = usePathname();
  const publica = rotasPublicas.includes(caminho);

  return (
    <header className={estilos.topo}>
      <div className={estilos.linha}>
        <Link href="/" className={estilos.marca} aria-label="TeamTalk, página inicial">
          <span className={estilos.simbolo} aria-hidden="true">T</span>
          <span className={estilos.nome}>TeamTalk</span>
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
          </nav>
        </div>
      )}
    </header>
  );
}

export function RodapeTopo() {
  return <footer className={estilos.rodape}>© 2026 TeamTalk. Chat corporativo interno.</footer>;
}
