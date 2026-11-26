"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Botao, Campo } from "@design/componentes";
import { Icone } from "@design/icones/icone";
import type { ContatoDado } from "../front-end/src/contatos/acoes";
import type { Mensagem } from "../front-end/src/mensagens/acoes";
import estilos from "./tela-conversas.module.css";

export type ConversaDado = {
  contato_id: string;
  nome: string;
  arroba: string;
  ultima_texto: string;
  ultima_em: string;
  nao_lidas: number;
};

type Props = {
  conversas: ConversaDado[];
  contatos: ContatoDado[];
  mensagens: Mensagem[];
  meuId: string | null;
  contatoAtivo: ContatoDado | null;
  carregandoLista?: boolean;
  carregandoHistorico?: boolean;
  erroLista?: string | null;
  erroHistorico?: string | null;
  erroEnvio?: string | null;
  aoAbrirContato: (contato: ContatoDado) => void;
  aoRecarregarLista: () => void;
  aoRecarregarHistorico: () => void;
  aoEnviar: (texto: string) => Promise<boolean>;
  aoVoltar: () => void;
};

const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", {
  hour: "2-digit", minute: "2-digit", timeZone: "America/Bahia",
});

const horarioLista = (iso: string) => {
  const data = new Date(iso);
  const hoje = new Date();
  if (data.toDateString() === hoje.toDateString()) return hora(iso);
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);
  if (data.toDateString() === ontem.toDateString()) return "Ontem";
  return data.toLocaleDateString("pt-BR", { weekday: "short", timeZone: "America/Bahia" })
    .replace(".", "").replace(/^./, (letra) => letra.toLocaleUpperCase("pt-BR"));
};

function avatar(nome: string, foto?: string | null) {
  return foto
    ? <img className={estilos.avatar} src={foto} alt="" />
    : <span className={estilos.avatar} aria-hidden="true">{nome.trim().slice(0, 1).toLocaleUpperCase("pt-BR")}</span>;
}

export function TelaConversas({
  conversas, contatos, mensagens, meuId, contatoAtivo, carregandoLista = false,
  carregandoHistorico = false, erroLista, erroHistorico, erroEnvio,
  aoAbrirContato, aoRecarregarLista, aoRecarregarHistorico, aoEnviar,
  aoVoltar,
}: Props) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const listaRef = useRef<HTMLDivElement>(null);
  const fimRef = useRef<HTMLDivElement>(null);
  const seguindoFim = useRef(true);
  const contatosNovos = contatos.filter((p) => !conversas.some((c) => c.contato_id === p.id));

  useEffect(() => {
    if (seguindoFim.current) fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensagens, contatoAtivo?.id, carregandoHistorico]);

  useEffect(() => { setTexto(""); }, [contatoAtivo?.id]);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    const enviado = await aoEnviar(texto);
    setEnviando(false);
    if (enviado) setTexto("");
  }

  function acompanharRolagem() {
    const elemento = listaRef.current;
    if (elemento) seguindoFim.current = elemento.scrollHeight - elemento.scrollTop - elemento.clientHeight < 80;
  }

  if (contatoAtivo) {
    return (
      <section className={estilos.chat} aria-label={`Conversa com ${contatoAtivo.nome}`}>
        <header className={estilos.chatCabecalho}>
          <button className={estilos.voltar} type="button" onClick={aoVoltar} aria-label="Voltar para a lista de conversas"><Icone nome="voltar" /></button>
          {avatar(contatoAtivo.nome, contatoAtivo.foto_url)}
          <div className={estilos.identidade}><h1>{contatoAtivo.nome}</h1><p>@{contatoAtivo.arroba}</p></div>
        </header>
        <div className={estilos.historico} ref={listaRef} onScroll={acompanharRolagem} aria-live="polite" aria-busy={carregandoHistorico}>
          {carregandoHistorico && <p className={estilos.estado} role="status">Carregando mensagens…</p>}
          {erroHistorico && <div className={estilos.estadoErro} role="alert"><p>{erroHistorico}</p><Botao variante="secundaria" onClick={aoRecarregarHistorico}>Tentar novamente</Botao></div>}
          {!carregandoHistorico && !erroHistorico && mensagens.length === 0 && <p className={estilos.estado}>Nenhuma mensagem ainda. Diga olá!</p>}
          {mensagens.map((mensagem) => {
            const minha = mensagem.remetente_id === meuId;
            return <article key={mensagem.id} className={`${estilos.mensagem} ${minha ? estilos.minha : estilos.recebida}`}>
              <p>{mensagem.texto}</p>
              <footer><time dateTime={mensagem.criado_em}>{hora(mensagem.criado_em)}</time>{minha && <span className={estilos.status} aria-label={mensagem.lida_em ? "Lida" : "Enviada"}><Icone nome={mensagem.lida_em ? "lida" : "enviada"} /></span>}</footer>
            </article>;
          })}
          <div ref={fimRef} />
        </div>
        <form className={estilos.compositor} onSubmit={enviar}>
          <Campo id="texto-mensagem" rotulo="Mensagem" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Digite uma mensagem…" maxLength={2000} autoComplete="off" />
          <Botao type="submit" ocupado={enviando} disabled={!texto.trim()} aria-label="Enviar mensagem"><Icone nome="enviar" /></Botao>
          {erroEnvio && <p className={estilos.erroEnvio} role="alert">{erroEnvio}</p>}
        </form>
      </section>
    );
  }

  return (
    <main className={estilos.listaPagina}>
      <header className={estilos.listaCabecalho}><div><h1>Conversas</h1><p>Suas mensagens</p></div><button type="button" className={estilos.novaConversa} aria-label="Iniciar nova conversa" disabled={!contatosNovos.length} onClick={() => contatosNovos[0] && aoAbrirContato(contatosNovos[0])}><Icone nome="nova-conversa" /></button></header>
      {carregandoLista ? <div className={estilos.esqueletos} role="status" aria-label="Carregando conversas">{Array.from({ length: 5 }, (_, i) => <div className={estilos.esqueleto} key={i}><i /><span><b /><b /></span></div>)}</div>
        : erroLista ? <section className={estilos.estadoErro} role="alert"><div className={estilos.erroMarca} aria-hidden="true"><Icone nome="erro" /></div><h2>Não foi possível carregar suas conversas.</h2><p>Verifique sua conexão ou tente novamente mais tarde.</p><Botao onClick={aoRecarregarLista}>Tentar novamente</Botao></section>
          : conversas.length === 0 ? <section className={estilos.listaVazia}><span className={estilos.baloes} aria-hidden="true"><Icone nome="lista-vazia" /></span><h2>Nenhuma conversa ainda</h2><p>Comece uma nova conversa com alguém dos seus contatos.</p>{contatosNovos.length > 0 && <div className={estilos.contatosNovos}>{contatosNovos.map((p) => <button className={estilos.item} type="button" key={p.id} onClick={() => aoAbrirContato(p)}>{avatar(p.nome, p.foto_url)}<span className={estilos.dados}><strong>{p.nome}</strong><small>@{p.arroba}</small></span><span className={estilos.seta} aria-hidden="true">›</span></button>)}</div>}</section>
            : <>
              <section aria-label="Lista de conversas"><ul className={estilos.lista}>{conversas.map((c) => {
                const contato = contatos.find((p) => p.id === c.contato_id);
                return <li key={c.contato_id}><button className={estilos.item} type="button" onClick={() => aoAbrirContato({ id: c.contato_id, nome: c.nome, arroba: c.arroba, foto_url: contato?.foto_url ?? null })}>{avatar(c.nome, contato?.foto_url)}<span className={estilos.dados}><strong>{c.nome}</strong><small>{c.ultima_texto}</small></span><span className={estilos.meta}><time dateTime={c.ultima_em}>{horarioLista(c.ultima_em)}</time>{c.nao_lidas > 0 && <span className={estilos.naoLidas} aria-label={`${c.nao_lidas} mensagens não lidas`}>{c.nao_lidas > 99 ? "99+" : c.nao_lidas}</span>}</span></button></li>;
              })}</ul></section>
              {contatosNovos.length > 0 && <section className={estilos.novas} aria-labelledby="novas-conversas"><h2 id="novas-conversas">Nova conversa</h2><ul className={estilos.lista}>{contatosNovos.map((p) => <li key={p.id}><button className={estilos.item} type="button" onClick={() => aoAbrirContato(p)}>{avatar(p.nome, p.foto_url)}<span className={estilos.dados}><strong>{p.nome}</strong><small>@{p.arroba}</small></span><span className={estilos.seta} aria-hidden="true">›</span></button></li>)}</ul></section>}
            </>}
    </main>
  );
}
