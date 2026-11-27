"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Botao } from "./botao";
import estilos from "@design/componentes/menu-acoes.module.css";

export type ItemMenuAcoes = {
  id: string;
  rotulo: string;
  /** Ícone opcional à esquerda do texto. */
  icone?: ReactNode;
  /** Vermelho, para ações que removem ou apagam. */
  perigo?: boolean;
  /** Se existir, o item pede confirmação com este texto antes de agir. */
  confirmacao?: string;
  /** Devolve um texto de erro ou null quando deu certo. */
  aoEscolher: () => Promise<string | null>;
};

export type PropsMenuAcoes = {
  itens: ItemMenuAcoes[];
  /** Nome lido por leitores de tela para o botão "⋯". */
  rotulo?: string;
  /** Conteúdo do botão no lugar do "⋯" (por exemplo, um "+"). */
  gatilho?: ReactNode;
  /** Abre a lista acima do botão (para menus no rodapé da tela). */
  paraCima?: boolean;
  /** Botão redondo, igual ao botão de enviar do chat. */
  redondo?: boolean;
};

/** Botão "⋯" que abre uma lista curta de ações (com confirmação opcional). Fecha ao clicar fora ou com Esc. */
export function MenuAcoes({ itens, rotulo = "Mais ações", gatilho, paraCima = false, redondo = false }: PropsMenuAcoes) {
  const raiz = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const [pendente, setPendente] = useState<ItemMenuAcoes | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  function fechar() { setAberto(false); setPendente(null); setErro(""); }

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (!ocupado && raiz.current && !raiz.current.contains(e.target as Node)) fechar(); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape" && !ocupado) fechar(); };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc); };
  }, [aberto, ocupado]);

  async function executar(item: ItemMenuAcoes) {
    setOcupado(true);
    setErro("");
    const falha = await item.aoEscolher();
    setOcupado(false);
    if (falha) { setErro(falha); return; }
    fechar();
  }

  if (itens.length === 0) return null;

  return (
    <div className={estilos.raiz} ref={raiz}>
      <Botao className={`${estilos.gatilho} ${redondo ? estilos.redondo : ""}`} aria-label={rotulo} aria-haspopup="menu" aria-expanded={aberto} onClick={() => (aberto ? fechar() : setAberto(true))}>
        {gatilho ?? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>}
      </Botao>
      {aberto && (
        <div className={`${estilos.painel} ${paraCima ? estilos.cima : ""}`} role="menu">
          {pendente ? (
            <div className={estilos.confirmar}>
              <p>{pendente.confirmacao}</p>
              <Botao variante="perigo" ocupado={ocupado} onClick={() => executar(pendente)}>Confirmar</Botao>
              <Botao variante="secundaria" disabled={ocupado} onClick={() => { setPendente(null); setErro(""); }}>Cancelar</Botao>
            </div>
          ) : (
            itens.map((item) => (
              <button key={item.id} type="button" role="menuitem" className={`${estilos.item} ${item.perigo ? estilos.perigo : ""}`}
                onClick={() => (item.confirmacao ? setPendente(item) : executar(item))}>
                {item.icone && <span className={estilos.icone} aria-hidden="true">{item.icone}</span>}
                {item.rotulo}
              </button>
            ))
          )}
          {erro && <p className={estilos.erro} role="alert">{erro}</p>}
        </div>
      )}
    </div>
  );
}
