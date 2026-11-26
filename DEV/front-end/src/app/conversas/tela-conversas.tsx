"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Botao, Campo, CabecalhoMobile, Carregando, LayoutMobile } from "@design/componentes";
import estilos from "./conversas.module.css";

export type Pessoa = { id: string; nome: string; arroba: string };
export type ResumoConversa = Pessoa & { ultimaTexto: string; ultimaEm: string; naoLidas: number };
export type BalaoDado = { id: string; minha: boolean; texto: string; criadoEm: string };

type Props = {
  /** Primeira carga da lista em andamento. */
  carregando?: boolean;
  conversas: ResumoConversa[];
  /** Contatos que ainda não têm conversa (para começar uma). */
  novos: Pessoa[];
  ativa: Pessoa | null;
  mensagens: BalaoDado[];
  aoAbrir: (pessoa: Pessoa) => void;
  aoVoltar: () => void;
  /** Devolve um texto de erro ou null quando enviou. */
  aoEnviar: (texto: string) => Promise<string | null>;
};

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

export function TelaConversas({ carregando = false, conversas, novos, ativa, mensagens, aoAbrir, aoVoltar, aoEnviar }: Props) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => { fim.current?.scrollIntoView({ block: "end" }); }, [mensagens]);
  useEffect(() => { setTexto(""); setErro(""); }, [ativa?.id]);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    setErro("");
    const falha = await aoEnviar(texto);
    setEnviando(false);
    if (falha) setErro(falha);
    else setTexto("");
  }

  if (ativa) {
    return (
      <LayoutMobile cabecalho={<CabecalhoMobile titulo={ativa.nome} subtitulo={`@${ativa.arroba}`} aoVoltar={aoVoltar} rotuloVoltar="Voltar para as conversas" />}>
        <div className={estilos.historico} aria-live="polite">
          {mensagens.length === 0 && <p className={estilos.vazio}>Nenhuma mensagem ainda. Diga olá!</p>}
          {mensagens.map((m) => (
            <div key={m.id} className={`${estilos.mensagem} ${m.minha ? estilos.minha : ""}`}>
              <p>{m.texto}</p>
              <time dateTime={m.criadoEm}>{hora(m.criadoEm)}</time>
            </div>
          ))}
          <div ref={fim} />
        </div>
        <form className={estilos.envio} onSubmit={enviar}>
          <Campo
            id="texto-mensagem"
            rotulo="Mensagem"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Digite sua mensagem"
            autoComplete="off"
            maxLength={2000}
            erro={erro || undefined}
          />
          <Botao type="submit" ocupado={enviando} disabled={!texto.trim()}>Enviar</Botao>
        </form>
      </LayoutMobile>
    );
  }

  return (
    <LayoutMobile cabecalho={<CabecalhoMobile titulo="Conversas" subtitulo="Suas mensagens" />}>
      <section aria-label="Conversas">
        {carregando ? (
          <div className={estilos.carregando}><Carregando /></div>
        ) : conversas.length === 0 ? (
          <p className={estilos.vazio}>Nenhuma conversa ainda.</p>
        ) : (
          <ul className={estilos.lista}>
            {conversas.map((c) => (
              <li key={c.id}>
                <button type="button" className={estilos.cartao} onClick={() => aoAbrir(c)}>
                  <span className={estilos.avatar} aria-hidden="true">{c.nome[0]}</span>
                  <span className={estilos.dados}>
                    <strong>{c.nome}</strong>
                    <span>{c.ultimaTexto}</span>
                  </span>
                  <span className={estilos.lado}>
                    <time dateTime={c.ultimaEm}>{hora(c.ultimaEm)}</time>
                    {c.naoLidas > 0 && <span className={estilos.naoLidas} aria-label={`${c.naoLidas} não lidas`}>{c.naoLidas}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {novos.length > 0 && (
        <section className={estilos.secao} aria-labelledby="titulo-nova">
          <h2 id="titulo-nova">Nova conversa</h2>
          <ul className={estilos.lista}>
            {novos.map((p) => (
              <li key={p.id}>
                <button type="button" className={estilos.cartao} onClick={() => aoAbrir(p)}>
                  <span className={estilos.avatar} aria-hidden="true">{p.nome[0]}</span>
                  <span className={estilos.dados}>
                    <strong>{p.nome}</strong>
                    <span>@{p.arroba}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </LayoutMobile>
  );
}
