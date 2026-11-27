"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Botao, Campo } from "@design/componentes";
import { Icone } from "@design/icones/icone";
import { Avatar } from "../contatos/avatar";
import estilos from "../grupos/grupos.module.css";

export type PessoaEscolhivel = { id: string; nome: string; arroba: string; fotoUrl?: string | null };

function useEsc(aoFechar: () => void) {
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.key === "Escape") aoFechar(); };
    document.addEventListener("keydown", f);
    return () => document.removeEventListener("keydown", f);
  }, [aoFechar]);
}

/** Escolher um contato para compartilhar na conversa. */
export function DialogoContato({ carregar, aoEscolher, aoFechar }: {
  carregar: () => Promise<PessoaEscolhivel[]>;
  aoEscolher: (id: string) => Promise<string | null>;
  aoFechar: () => void;
}) {
  const [lista, setLista] = useState<PessoaEscolhivel[] | null>(null);
  const [filtro, setFiltro] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  useEsc(aoFechar);
  useEffect(() => { carregar().then(setLista).catch(() => { setLista([]); setErro("Não foi possível carregar seus contatos."); }); }, [carregar]);
  const visiveis = useMemo(() => {
    const t = filtro.trim().toLowerCase().replace(/^@/, "");
    return (lista ?? []).filter((p) => !t || p.nome.toLowerCase().includes(t) || p.arroba.toLowerCase().includes(t));
  }, [lista, filtro]);

  async function escolher(id: string) {
    setEnviando(true); setErro("");
    const falha = await aoEscolher(id);
    setEnviando(false);
    if (falha) setErro(falha); else aoFechar();
  }

  return (
    <div className={estilos.fundo} onMouseDown={aoFechar}>
      <div className={estilos.painel} role="dialog" aria-modal="true" aria-label="Enviar contato" onMouseDown={(e) => e.stopPropagation()}>
        <header className={estilos.painelTopo}>
          <h2>Enviar contato</h2>
          <Botao variante="discreta" onClick={aoFechar} aria-label="Fechar"><Icone nome="fechar" width={18} height={18} /></Botao>
        </header>
        <Campo id="buscar-contato-enviar" rotulo="Buscar contato" value={filtro} onChange={(e) => setFiltro(e.target.value)} autoComplete="off" />
        <ul className={estilos.seletorLista} aria-label="Contatos">
          {visiveis.map((p) => (
            <li key={p.id}>
              <button type="button" className={estilos.opcao} style={{ width: "100%", background: "transparent", border: 0, textAlign: "left", font: "inherit" }} disabled={enviando} onClick={() => void escolher(p.id)}>
                <Avatar nome={p.nome} fotoUrl={p.fotoUrl} />
                <span className={estilos.nomes}><strong>{p.nome}</strong><span>@{p.arroba}</span></span>
              </button>
            </li>
          ))}
          {lista && visiveis.length === 0 && <li className={estilos.vazio}>Nenhum contato encontrado.</li>}
          {!lista && <li className={estilos.vazio}>Carregando…</li>}
        </ul>
        {erro && <p className={estilos.erro} role="alert">{erro}</p>}
      </div>
    </div>
  );
}

/** Criar uma enquete: pergunta, de 2 a 6 opções e se aceita várias respostas. */
export function DialogoEnquete({ aoCriar, aoFechar }: {
  aoCriar: (pergunta: string, opcoes: string[], multipla: boolean) => Promise<string | null>;
  aoFechar: () => void;
}) {
  const [pergunta, setPergunta] = useState("");
  const [opcoes, setOpcoes] = useState(["", ""]);
  const [multipla, setMultipla] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  useEsc(aoFechar);
  const preenchidas = opcoes.filter((o) => o.trim()).length;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true); setErro("");
    const falha = await aoCriar(pergunta, opcoes, multipla);
    setEnviando(false);
    if (falha) setErro(falha); else aoFechar();
  }

  return (
    <div className={estilos.fundo} onMouseDown={aoFechar}>
      <form className={estilos.painel} role="dialog" aria-modal="true" aria-label="Criar enquete" onMouseDown={(e) => e.stopPropagation()} onSubmit={enviar}>
        <header className={estilos.painelTopo}>
          <h2>Criar enquete</h2>
          <Botao variante="discreta" onClick={aoFechar} aria-label="Fechar"><Icone nome="fechar" width={18} height={18} /></Botao>
        </header>
        <Campo id="pergunta-enquete" rotulo="Pergunta" value={pergunta} onChange={(e) => setPergunta(e.target.value)} maxLength={300} autoComplete="off" autoFocus />
        {opcoes.map((o, i) => (
          <div key={i} style={{ display: "flex", gap: "var(--espaco-2)", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <Campo id={`opcao-enquete-${i}`} rotulo={`Opção ${i + 1}`} value={o} maxLength={100} autoComplete="off" onChange={(e) => setOpcoes((a) => a.map((x, j) => (j === i ? e.target.value : x)))} />
            </div>
            {opcoes.length > 2 && <Botao variante="discreta" onClick={() => setOpcoes((a) => a.filter((_, j) => j !== i))} aria-label={`Remover opção ${i + 1}`}>Remover</Botao>}
          </div>
        ))}
        {opcoes.length < 6 && <Botao variante="secundaria" onClick={() => setOpcoes((a) => [...a, ""])}>Adicionar opção</Botao>}
        <label className={estilos.interruptor}>
          <input type="checkbox" checked={multipla} onChange={(e) => setMultipla(e.target.checked)} />
          <span>Permitir várias respostas</span>
        </label>
        {erro && <p className={estilos.erro} role="alert">{erro}</p>}
        <div className={estilos.acoes}>
          <Botao variante="secundaria" onClick={aoFechar} disabled={enviando}>Cancelar</Botao>
          <Botao type="submit" ocupado={enviando} disabled={!pergunta.trim() || preenchidas < 2}>Enviar</Botao>
        </div>
      </form>
    </div>
  );
}
