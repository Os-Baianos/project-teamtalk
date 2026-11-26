"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import Link from "next/link";
import { Botao, Carregando } from "../../../../../front-end/src/design/componentes";
import { Icone } from "../../../../../front-end/src/design/icones/icone";
import estilos from "./conversas.module.css";

export type Pessoa = { id: string; nome: string; arroba: string; fotoUrl?: string | null };
export type StatusEnvio = "enviando" | "enviada" | "recebida" | "lida" | "falha";
export type ResumoConversa = Pessoa & {
  ultimaTexto: string;
  ultimaEm: string;
  naoLidas: number;
  ultimaMinha: boolean;
  ultimaStatus: "enviada" | "recebida" | "lida";
};
export type BalaoDado = { id: string; minha: boolean; texto: string; criadoEm: string; status: StatusEnvio };

type Props = {
  carregandoLista: boolean;
  erroLista?: boolean;
  aoTentarCarregarLista?: () => void;
  carregandoMensagens: boolean;
  erroHistorico?: boolean;
  aoTentarCarregarHistorico?: () => void;
  conversas: ResumoConversa[];
  novos: Pessoa[];
  ativa: Pessoa | null;
  mensagens: BalaoDado[];
  aoAbrir: (pessoa: Pessoa) => void;
  aoVoltar: () => void;
  aoEnviar: (texto: string) => Promise<string | null>;
  aoReenviar?: (id: string) => Promise<string | null>;
};

const FUSO = "America/Sao_Paulo";
const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: FUSO });
const data = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: FUSO });

function horarioLista(iso: string) {
  const agora = new Date();
  const ontem = new Date(agora);
  ontem.setDate(agora.getDate() - 1);
  if (data(iso) === data(agora.toISOString())) return hora(iso);
  if (data(iso) === data(ontem.toISOString())) return "Ontem";
  return new Date(iso).toLocaleDateString("pt-BR", { weekday: "short", timeZone: FUSO }).replace(".", "");
}

function Status({ status }: { status: StatusEnvio }) {
  const labels: Record<StatusEnvio, string> = { enviando: "Aguardando envio", enviada: "Enviada", recebida: "Entregue", lida: "Lida", falha: "Falha no envio" };
  const icone = status === "enviando" ? "aguardando" : status === "falha" ? "falha" : status === "enviada" ? "enviada" : "lida";
  return <span className={`${estilos.status} ${estilos[`status_${status}`]}`} role="img" aria-label={labels[status]} title={labels[status]}><Icone nome={icone} width={16} height={16} /></span>;
}

function AvatarPessoa({ pessoa, pequeno = false }: { pessoa: Pessoa; pequeno?: boolean }) {
  const initials = pessoa.nome.trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  return pessoa.fotoUrl
    ? <img className={`${estilos.avatar} ${pequeno ? estilos.avatarPequeno : ""}`} src={pessoa.fotoUrl} alt="" />
    : <span className={`${estilos.avatar} ${pequeno ? estilos.avatarPequeno : ""}`} aria-hidden="true">{initials}</span>;
}

export function TelaConversas(props: Props) {
  const { carregandoLista, erroLista = false, aoTentarCarregarLista, carregandoMensagens, erroHistorico = false,
    aoTentarCarregarHistorico, conversas, novos, ativa, mensagens, aoAbrir, aoVoltar, aoEnviar, aoReenviar } = props;
  const [busca, setBusca] = useState("");
  const [mostrarContatos, setMostrarContatos] = useState(false);
  const [texto, setTexto] = useState("");
  const [erroEnvio, setErroEnvio] = useState("");
  const [enviando, setEnviando] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const fim = useRef<HTMLDivElement>(null);
  const acompanharFim = useRef(true);

  useEffect(() => {
    acompanharFim.current = true;
    requestAnimationFrame(() => fim.current?.scrollIntoView({ block: "end" }));
  }, [ativa?.id]);

  useEffect(() => {
    if (acompanharFim.current) requestAnimationFrame(() => fim.current?.scrollIntoView({ block: "end" }));
  }, [mensagens]);

  useEffect(() => { setTexto(""); setErroEnvio(""); }, [ativa?.id]);

  const termo = busca.trim().toLocaleLowerCase("pt-BR").replace(/^@/, "");
  const filtrar = (p: Pessoa) => !termo || p.nome.toLocaleLowerCase("pt-BR").includes(termo) || p.arroba.toLocaleLowerCase("pt-BR").includes(termo);
  const lista = conversas.filter(filtrar);
  const listaNovos = novos.filter(filtrar);

  const itens = useMemo(() => {
    const resultado: ({ tipo: "dia"; id: string; rotulo: string } | { tipo: "mensagem"; mensagem: BalaoDado })[] = [];
    let diaAnterior = "";
    for (const mensagem of mensagens) {
      const idDia = data(mensagem.criadoEm);
      if (idDia !== diaAnterior) {
        const hoje = data(new Date().toISOString());
        const ontem = new Date(); ontem.setDate(ontem.getDate() - 1);
        resultado.push({ tipo: "dia", id: idDia, rotulo: idDia === hoje ? "Hoje" : idDia === data(ontem.toISOString()) ? "Ontem" : idDia });
        diaAnterior = idDia;
      }
      resultado.push({ tipo: "mensagem", mensagem });
    }
    return resultado;
  }, [mensagens]);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const mensagem = texto.trim();
    if (!mensagem || enviando) return;
    setEnviando(true);
    setErroEnvio("");
    const erro = await aoEnviar(mensagem);
    setEnviando(false);
    setTexto("");
    if (erro) setErroEnvio(erro);
  }

  async function reenviar(id: string) {
    if (!aoReenviar) return;
    const erro = await aoReenviar(id);
    setErroEnvio(erro ?? "");
  }

  function teclas(evento: KeyboardEvent<HTMLTextAreaElement>) {
    if (evento.key === "Enter" && !evento.shiftKey) {
      evento.preventDefault();
      void enviar(evento);
    }
  }

  const statusLista = (c: ResumoConversa) => c.ultimaMinha ? <Status status={c.ultimaStatus} /> : null;

  return (
    <div className={estilos.raiz}>
      <section className={`${estilos.painelLista} ${ativa ? estilos.listaOcultaMobile : ""}`} aria-label="Lista de conversas">
        <header className={estilos.listaCabecalho}>
          <h1>Chats</h1>
          <button type="button" className={estilos.iconeBotao} onClick={() => setMostrarContatos((visivel) => !visivel)} aria-label={mostrarContatos ? "Voltar para conversas" : "Nova conversa"} aria-expanded={mostrarContatos}>
            <Icone nome={mostrarContatos ? "voltar" : "nova-conversa"} />
          </button>
        </header>

        <label className={estilos.busca}>
          <Icone nome="busca" width={20} height={20} />
          <span className={estilos.somenteLeitor}>Buscar conversa ou contato</span>
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar" aria-label="Buscar conversa ou contato" autoComplete="off" />
        </label>

        <div className={estilos.abas} role="tablist" aria-label="Filtrar conversas">
          <button type="button" role="tab" aria-selected="true" className={estilos.abaAtiva}>Todos</button>
          <button type="button" role="tab" aria-selected="false" disabled title="Conversas de equipe ainda não estão disponíveis">Equipes</button>
          <button type="button" role="tab" aria-selected="false" disabled title="Favoritos ainda não estão disponíveis">Favoritos</button>
        </div>

        <div className={estilos.rolagemLista}>
          {erroLista ? (
            <div className={estilos.estado} role="alert">
              <Icone nome="erro" width={36} height={36} />
              <strong>Não foi possível carregar suas conversas.</strong>
              <span>Verifique sua conexão ou tente novamente mais tarde.</span>
              <Botao variante="secundaria" className={estilos.botaoReferencia} onClick={aoTentarCarregarLista}>Tentar novamente</Botao>
            </div>
          ) : carregandoLista ? (
            <div className={estilos.estado}><Carregando texto="Carregando conversas" /></div>
          ) : mostrarContatos ? (
            <>
              <h2 className={estilos.tituloSecao}>Nova conversa</h2>
              {listaNovos.length ? <ul className={estilos.lista}>{listaNovos.map((p) => <li key={p.id}><button type="button" className={estilos.item} onClick={() => { aoAbrir(p); setMostrarContatos(false); }}><AvatarPessoa pessoa={p} /><span className={estilos.dados}><strong>{p.nome}</strong><span>@{p.arroba}</span></span></button></li>)}</ul> : <p className={estilos.estadoCurto}>Nenhum contato disponível para iniciar uma conversa.</p>}
            </>
          ) : (
            <>
              {conversas.length === 0 && !termo ? (
                <div className={estilos.estadoVazio}>
                  <Icone nome="lista-vazia" width={72} height={60} />
                  <strong>Nenhuma conversa ainda</strong>
                  <span>Comece uma nova conversa com um contato.</span>
                  <Botao className={estilos.botaoReferencia} onClick={() => setMostrarContatos(true)}>Nova conversa</Botao>
                </div>
              ) : lista.length === 0 && listaNovos.length === 0 ? <p className={estilos.estadoCurto}>Nada encontrado.</p> : (
                <>
                {lista.length > 0 && <ul className={estilos.lista}>
                  {lista.map((c) => <li key={c.id}>
                    <button type="button" className={`${estilos.item} ${ativa?.id === c.id ? estilos.itemAtivo : ""}`} onClick={() => aoAbrir(c)} aria-current={ativa?.id === c.id ? "true" : undefined}>
                      <AvatarPessoa pessoa={c} />
                      <span className={estilos.dados}>
                        <span className={estilos.linha}><strong>{c.nome}</strong><time dateTime={c.ultimaEm}>{horarioLista(c.ultimaEm)}</time></span>
                        <span className={estilos.linha}><span className={estilos.previa}>{statusLista(c)}{c.ultimaTexto}</span>{c.naoLidas > 0 && <span className={estilos.naoLidas} aria-label={`${c.naoLidas} mensagens não lidas`}>{c.naoLidas > 99 ? "99+" : c.naoLidas}</span>}</span>
                      </span>
                    </button>
                  </li>)}
                </ul>}
                {termo && listaNovos.length > 0 && <>
                  <h2 className={estilos.tituloSecao}>Contatos</h2>
                  <ul className={estilos.lista}>{listaNovos.map((p) => <li key={p.id}><button type="button" className={estilos.item} onClick={() => aoAbrir(p)}><AvatarPessoa pessoa={p} /><span className={estilos.dados}><strong>{p.nome}</strong><span>@{p.arroba}</span></span></button></li>)}</ul>
                </>}
                </>
              )}
              {lista.length > 0 && listaNovos.length > 0 && <button type="button" className={estilos.linkNovos} onClick={() => setMostrarContatos(true)}>Nova conversa</button>}
            </>
          )}
        </div>

        <nav className={estilos.navegacao} aria-label="Navegação principal">
          <Link href="/conversas" aria-current="page"><Icone nome="inbox" /><span>Chats</span></Link>
          <Link href="/contatos"><Icone nome="equipes" /><span>Contatos</span></Link>
          <button type="button" disabled aria-label="Arquivos ainda indisponíveis"><Icone nome="arquivos" /><span>Arquivos</span></button>
          <button type="button" disabled aria-label="Mais opções ainda indisponíveis"><Icone nome="menu" /><span>Mais</span></button>
        </nav>
      </section>

      <section className={`${estilos.painelChat} ${ativa ? estilos.chatVisivelMobile : ""}`} aria-label={ativa ? `Conversa com ${ativa.nome}` : "Conversa"}>
        {!ativa ? <div className={estilos.semConversa}><Icone nome="lista-vazia" width={72} height={60} /><p>Escolha uma conversa para começar</p></div> : <>
          <header className={estilos.chatCabecalho}>
            <button type="button" className={`${estilos.iconeBotao} ${estilos.voltarMobile}`} onClick={aoVoltar} aria-label="Voltar para conversas"><Icone nome="voltar" /></button>
            <AvatarPessoa pessoa={ativa} pequeno />
            <span><strong>{ativa.nome}</strong><small>@{ativa.arroba}</small></span>
          </header>

          <div className={estilos.historico} ref={viewport} onScroll={(e) => {
            const el = e.currentTarget;
            acompanharFim.current = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
          }} aria-live="polite" aria-relevant="additions text">
            {erroHistorico ? <div className={estilos.estado}><Icone nome="erro" /><strong>Não foi possível carregar as mensagens.</strong><Botao variante="secundaria" className={estilos.botaoReferencia} onClick={aoTentarCarregarHistorico}>Tentar novamente</Botao></div> : carregandoMensagens ? <div className={estilos.estado}><Carregando texto="Carregando mensagens" /></div> : mensagens.length === 0 ? <p className={estilos.vazioChat}>Nenhuma mensagem ainda. Diga olá!</p> : itens.map((item) => item.tipo === "dia" ? <div key={`dia-${item.id}`} className={estilos.separadorDia}><span>{item.rotulo}</span></div> : <div key={item.mensagem.id} className={`${estilos.linhaMensagem} ${item.mensagem.minha ? estilos.linhaMinha : ""}`}>
              <article className={`${estilos.balao} ${item.mensagem.minha ? estilos.balaoMeu : estilos.balaoRecebido} ${item.mensagem.status === "falha" ? estilos.balaoFalha : ""}`}>
                <p>{item.mensagem.texto}</p>
                <footer><time dateTime={item.mensagem.criadoEm}>{hora(item.mensagem.criadoEm)}</time>{item.mensagem.minha && <Status status={item.mensagem.status} />}</footer>
                {item.mensagem.status === "falha" && <button type="button" className={estilos.reenviar} onClick={() => void reenviar(item.mensagem.id)} aria-label="Reenviar mensagem">Tentar novamente</button>}
              </article>
            </div>)}
            <div ref={fim} />
          </div>

          <form className={estilos.composicao} onSubmit={enviar}>
            <textarea rows={1} value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={teclas} placeholder="Digite uma mensagem" aria-label="Mensagem" autoComplete="off" maxLength={2000} />
            <button type="submit" disabled={!texto.trim() || enviando} aria-label="Enviar mensagem">{enviando ? <Carregando tamanho="1.1rem" texto="" cor="herdar" /> : <Icone nome="enviar" width={20} height={20} />}</button>
            {erroEnvio && <p role="alert">{erroEnvio}</p>}
          </form>
        </>}
      </section>
    </div>
  );
}

