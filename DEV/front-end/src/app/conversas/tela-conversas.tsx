"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ClipboardEvent, FormEvent, KeyboardEvent } from "react";
import { Aviso } from "@design/componentes/aviso";
import { MenuAcoes } from "@design/componentes/menu-acoes";
import { Carregando } from "@design/componentes/carregando";
import { Icone } from "@design/icones/icone";
import { Avatar } from "../../contatos/avatar";
import { ehImagem, ehVideo, formatarTamanho, resumoMensagem, TIPOS_DOCUMENTO, TIPOS_MIDIA, validarArquivo } from "../../mensagens/anexos";
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
export type BalaoDado = {
  id: string;
  minha: boolean;
  texto: string;
  criadoEm: string;
  /** Mensagem a que esta responde (autor vazio = original indisponível). */
  resposta: { id: string; autor: string; texto: string } | null;
  recebidaEm: string | null;
  lidaEm: string | null;
  editadaEm: string | null;
  apagada: boolean;
  status: StatusEnvio;
  /** Arquivo anexado (url só existe para imagens, depois de carregar). */
  anexo: { nome: string; tipo: string; tamanho: number; url: string | null; expirado: boolean } | null;
};

type Props = {
  carregandoLista: boolean;
  carregandoMensagens: boolean;
  erroLista: boolean;
  aoTentarLista: () => void;
  erroHistorico: boolean;
  aoTentarHistorico: () => void;
  aoReenviar: (id: string) => void;
  conversas: ResumoConversa[];
  /** Contatos que ainda não têm conversa (para começar uma). */
  novos: Pessoa[];
  ativa: Pessoa | null;
  mensagens: BalaoDado[];
  aoAbrir: (pessoa: Pessoa) => void;
  aoVoltar: () => void;
  /** Devolve um texto de erro ou null quando enviou. */
  aoEnviar: (texto: string, respondeA?: string | null, arquivo?: File | null) => Promise<string | null>;
  /** A outra pessoa está digitando para mim. */
  digitando: boolean;
  /** Aviso de que eu estou digitando (true) ou parei (false). */
  aoDigitar: (ativo?: boolean) => void;
  aoEditar: (id: string, texto: string) => Promise<boolean>;
  aoApagar: (id: string) => Promise<boolean>;
  aoBaixar: (id: string, visualizar?: boolean) => Promise<boolean>;
};

const FUSO = "America/Sao_Paulo";
const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: FUSO });
const dia = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: FUSO });
const completo = (iso: string) => `${dia(iso)} às ${hora(iso)}`;

/** Na lista: hora se for hoje, "Ontem" ou o dia da semana. */
function horarioLista(iso: string) {
  const d = dia(iso);
  const agora = Date.now();
  if (d === dia(new Date(agora).toISOString())) return hora(iso);
  if (d === dia(new Date(agora - 864e5).toISOString())) return "Ontem";
  return new Date(iso).toLocaleDateString("pt-BR", { weekday: "short", timeZone: FUSO }).replace(".", "");
}

function rotuloDia(iso: string) {
  const d = dia(iso);
  const agora = Date.now();
  if (d === dia(new Date(agora).toISOString())) return "Hoje";
  if (d === dia(new Date(agora - 864e5).toISOString())) return "Ontem";
  return d;
}

/** Tiques: 1 enviada, 2 cinza recebida, 2 azuis lida. */
function Tiques({ status }: { status: StatusEnvio | "enviada" | "recebida" | "lida" }) {
  const nomes = { enviando: "Enviando", enviada: "Enviada", recebida: "Recebida", lida: "Lida", falha: "Falha no envio" };
  const icone = status === "enviando" ? "aguardando" : status === "falha" ? "falha" : status === "enviada" ? "enviada" : "lida";
  return (
    <span className={`${estilos.tique} ${estilos[`tique_${status}`]}`} role="img" aria-label={nomes[status]} title={nomes[status]}>
      <Icone nome={icone} width={16} height={16} />
    </span>
  );
}

export function TelaConversas({
  carregandoLista, carregandoMensagens, erroLista, aoTentarLista, erroHistorico, aoTentarHistorico, aoReenviar, conversas, novos, ativa, mensagens,
  aoAbrir, aoVoltar, aoEnviar, aoEditar, aoApagar, aoBaixar, digitando, aoDigitar,
}: Props) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [listaAberta, setListaAberta] = useState(true);
  const [menu, setMenu] = useState<string | null>(null);
  const abertoEm = useRef(0);
  const toque = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Abre o menu da mensagem (clique na setinha no computador, segurar a mensagem no celular). */
  const abrirMenu = (id: string) => { abertoEm.current = Date.now(); setMenu(id); };
  /** Menu que não cabe abaixo (últimas mensagens) abre para cima, em vez de empurrar a conversa. */
  const mostrarMenu = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const caixa = el.closest("[data-historico]");
    if (caixa && el.getBoundingClientRect().bottom > caixa.getBoundingClientRect().bottom) el.dataset.cima = "true";
  }, []);
  const soltarToque = () => { if (toque.current) { clearTimeout(toque.current); toque.current = null; } };
  const [dados, setDados] = useState<BalaoDado | null>(null);
  const [editando, setEditando] = useState<BalaoDado | null>(null);
  const [respondendo, setRespondendo] = useState<BalaoDado | null>(null);
  const [destaque, setDestaque] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const historico = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const entradaDocumento = useRef<HTMLInputElement>(null);
  const entradaMidia = useRef<HTMLInputElement>(null);
  const entradaCamera = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const previa = useMemo(() => (arquivo && ehImagem(arquivo.type) ? URL.createObjectURL(arquivo) : null), [arquivo]);
  const abrirEntrada = (ref: React.RefObject<HTMLInputElement | null>) => async () => { ref.current?.click(); return null; };
  useEffect(() => () => { if (previa) URL.revokeObjectURL(previa); }, [previa]);

  function escolher(f: File | null | undefined) {
    if (!f) return;
    const motivo = validarArquivo(f);
    if (motivo) { setErro(motivo); return; }
    setErro("");
    setEditando(null);
    setArquivo(f);
    campo.current?.focus();
  }
  function colar(e: ClipboardEvent<HTMLTextAreaElement>) {
    const f = Array.from(e.clipboardData.files).find((x) => ehImagem(x.type));
    if (f) { e.preventDefault(); escolher(f); }
  }

  // Acompanha as mensagens novas só quando a pessoa está no fim; se subiu para ler, não puxa de volta.
  const noFim = useRef(true);
  useEffect(() => { noFim.current = true; }, [ativa?.id]);
  // Rola só a caixa das mensagens (scrollIntoView puxava a página inteira para baixo).
  useEffect(() => {
    const el = historico.current;
    if (el && noFim.current) el.scrollTop = el.scrollHeight;
  }, [mensagens.length, carregandoMensagens, ativa?.id]);
  useEffect(() => { setTexto(""); setErro(""); setMenu(null); setDados(null); setEditando(null); setRespondendo(null); setArquivo(null); }, [ativa?.id]);
  useEffect(() => {
    const el = campo.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    el.style.overflowY = el.scrollHeight > 140 ? "auto" : "hidden"; // sem barra de rolagem enquanto cabe
  }, [texto]);
  useEffect(() => {
    if (!menu) return;
    const fechar = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (e instanceof MouseEvent && (e.target as HTMLElement).closest("[data-menu]")) return;
      if (Date.now() - abertoEm.current < 400) return; // o toque que abriu não pode fechar logo em seguida
      setMenu(null);
    };
    document.addEventListener("pointerdown", fechar);
    document.addEventListener("keydown", fechar as EventListener);
    return () => {
      document.removeEventListener("pointerdown", fechar);
      document.removeEventListener("keydown", fechar as EventListener);
    };
  }, [menu]);
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(""), 2200);
    return () => clearTimeout(t);
  }, [aviso]);

  async function enviar(evento?: FormEvent) {
    evento?.preventDefault();
    const limpo = texto.trim();
    if ((!limpo && !arquivo && !editando?.anexo) || enviando) return;
    setEnviando(true);
    setErro("");
    noFim.current = true; // ao enviar, acompanha a própria mensagem
    if (editando) {
      const ok = limpo === editando.texto ? true : await aoEditar(editando.id, limpo);
      setEnviando(false);
      if (!ok) { setErro("Não foi possível editar a mensagem."); return; }
      setEditando(null);
      setTexto("");
      return;
    }
    aoDigitar(false);
    const falha = await aoEnviar(limpo, respondendo?.id ?? null, arquivo);
    setEnviando(false);
    if (falha) setErro(falha);
    else { setTexto(""); setRespondendo(null); setArquivo(null); }
    campo.current?.focus();
  }

  function teclas(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void enviar(); }
    if (e.key === "Escape" && editando) { setEditando(null); setTexto(""); }
    else if (e.key === "Escape" && arquivo) setArquivo(null);
    else if (e.key === "Escape" && respondendo) setRespondendo(null);
  }

  async function copiar(m: BalaoDado) {
    setMenu(null);
    try { await navigator.clipboard.writeText(m.texto); setAviso("Mensagem copiada"); }
    catch { setAviso("Não foi possível copiar"); }
  }

  function comecarResposta(m: BalaoDado) {
    setMenu(null);
    setEditando(null);
    setRespondendo(m);
    setErro("");
    setTimeout(() => campo.current?.focus(), 0);
  }

  /** Clicou na citação: rola até a mensagem original e a destaca por um instante. */
  function irParaOriginal(id: string) {
    const el = document.getElementById(`msg-${id}`);
    if (!el) { setAviso("A mensagem original não está mais na conversa"); return; }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setDestaque(id);
    setTimeout(() => setDestaque((atual) => (atual === id ? null : atual)), 1400);
  }

  function comecarEdicao(m: BalaoDado) {
    setMenu(null);
    setRespondendo(null);
    setEditando(m);
    setTexto(m.texto);
    setErro("");
    setTimeout(() => campo.current?.focus(), 0);
  }

  async function apagar(m: BalaoDado) {
    setMenu(null);
    if (!window.confirm("Apagar esta mensagem para todos?")) return;
    if (!(await aoApagar(m.id))) setAviso("Não foi possível apagar");
  }

  const termo = busca.trim().toLowerCase().replace(/^@/, "");
  const confere = (p: Pessoa) => !termo || p.nome.toLowerCase().includes(termo) || p.arroba.toLowerCase().includes(termo);
  const listaFiltrada = conversas.filter(confere);
  const novosFiltrados = novos.filter(confere);

  const itens = useMemo(() => {
    const saida: ({ tipo: "dia"; rotulo: string; chave: string } | { tipo: "msg"; m: BalaoDado })[] = [];
    let anterior = "";
    for (const m of mensagens) {
      const d = dia(m.criadoEm);
      if (d !== anterior) { saida.push({ tipo: "dia", rotulo: rotuloDia(m.criadoEm), chave: d }); anterior = d; }
      saida.push({ tipo: "msg", m });
    }
    return saida;
  }, [mensagens]);

  const statusLista = (c: ResumoConversa) => (c.ultimaMinha ? <Tiques status={c.ultimaStatus} /> : null);

  return (
    <div className={`${estilos.raiz} ${ativa ? estilos.comAtiva : ""} ${listaAberta ? "" : estilos.listaFechada}`}>
      <aside className={estilos.lista} aria-label="Conversas">
        <header className={estilos.listaTopo}>
          <h1>Conversas</h1>
          <button type="button" className={`${estilos.icone} ${estilos.soDesktop}`} onClick={() => setListaAberta(false)} aria-label="Ocultar conversas" title="Ocultar conversas">
            <Icone nome="voltar" width={20} height={20} />
          </button>
        </header>
        <div className={estilos.busca}>
          <Icone nome="busca" width={18} height={18} />
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar conversa" aria-label="Buscar conversa" autoComplete="off" />
        </div>
        <div className={estilos.rolagem}>
          {erroLista && conversas.length === 0 ? (
            <div className={estilos.estadoErro} role="alert">
              <Icone nome="erro" width={32} height={32} />
              <strong>Não foi possível carregar suas conversas.</strong>
              <button type="button" className={estilos.tentar} onClick={aoTentarLista}>Tentar novamente</button>
            </div>
          ) : carregandoLista ? (
            <div className={estilos.centro}><Carregando tamanho="2rem" texto="Carregando conversas" atraso /></div>
          ) : (
            <>
              {conversas.length === 0 && novos.length === 0 && <p className={estilos.vazio}>Nenhuma conversa ainda.</p>}
              {conversas.length > 0 && listaFiltrada.length === 0 && novosFiltrados.length === 0 && <p className={estilos.vazio}>Nada encontrado.</p>}
              <ul className={estilos.itens}>
                {listaFiltrada.map((c, i) => (
                  <li key={c.id} style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                    <button type="button" className={`${estilos.item} ${ativa?.id === c.id ? estilos.itemAtivo : ""}`} onClick={() => aoAbrir(c)} aria-current={ativa?.id === c.id ? "true" : undefined}>
                      <Avatar nome={c.nome} fotoUrl={c.fotoUrl} />
                      <span className={estilos.dados}>
                        <span className={estilos.linha}>
                          <strong>{c.nome}</strong>
                          <time dateTime={c.ultimaEm} className={c.naoLidas > 0 ? estilos.horaNova : ""}>{horarioLista(c.ultimaEm)}</time>
                        </span>
                        <span className={estilos.linha}>
                          <span className={estilos.previa}>{digitando && ativa?.id === c.id ? <span className={estilos.digitando}>digitando…</span> : <>{statusLista(c)}{c.ultimaTexto}</>}</span>
                          {c.naoLidas > 0 && <span className={estilos.naoLidas} aria-label={`${c.naoLidas} não lidas`}>{c.naoLidas > 99 ? "99+" : c.naoLidas}</span>}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {novosFiltrados.length > 0 && (
                <>
                  <h2 className={estilos.subtitulo}>Nova conversa</h2>
                  <ul className={estilos.itens}>
                    {novosFiltrados.map((p) => (
                      <li key={p.id}>
                        <button type="button" className={estilos.item} onClick={() => aoAbrir(p)}>
                          <Avatar nome={p.nome} fotoUrl={p.fotoUrl} />
                          <span className={estilos.dados}>
                            <strong>{p.nome}</strong>
                            <span className={estilos.previa}>@{p.arroba}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      </aside>

      <section className={estilos.chat} aria-label={ativa ? `Conversa com ${ativa.nome}` : "Conversa"}>
        {!ativa ? (
          <div className={estilos.semConversa}>
            {!listaAberta && (
              <button type="button" className={`${estilos.icone} ${estilos.abrirLista}`} onClick={() => setListaAberta(true)} aria-label="Mostrar conversas" title="Mostrar conversas">
                <Icone nome="menu" width={20} height={20} />
              </button>
            )}
            <Icone nome="simbolo" width={72} height={72} />
            <p>Escolha uma conversa para começar</p>
          </div>
        ) : (
          <>
            <header className={estilos.chatTopo}>
              <button type="button" className={`${estilos.icone} ${estilos.soMobile}`} onClick={aoVoltar} aria-label="Voltar para as conversas">
                <Icone nome="voltar" width={20} height={20} />
              </button>
              {!listaAberta && (
                <button type="button" className={`${estilos.icone} ${estilos.soDesktop}`} onClick={() => setListaAberta(true)} aria-label="Mostrar conversas" title="Mostrar conversas">
                  <Icone nome="menu" width={20} height={20} />
                </button>
              )}
              <Link className={estilos.chatPerfil} href={`/perfil/${ativa.arroba}`} aria-label={`Ver o perfil de ${ativa.nome}`}>
                <Avatar nome={ativa.nome} fotoUrl={ativa.fotoUrl} />
                <span className={estilos.chatNome}>
                  <strong>{ativa.nome}</strong>
                  {digitando ? <span className={estilos.digitando} role="status">digitando…</span> : <span>@{ativa.arroba}</span>}
                </span>
              </Link>
            </header>

            <div data-historico className={estilos.historico} ref={historico} aria-live="polite" onScroll={(e) => {
              const el = e.currentTarget;
              noFim.current = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
            }}>
              {erroHistorico ? (
                <div className={estilos.estadoErro} role="alert">
                  <Icone nome="erro" width={32} height={32} />
                  <strong>Não foi possível carregar as mensagens.</strong>
                  <button type="button" className={estilos.tentar} onClick={aoTentarHistorico}>Tentar novamente</button>
                </div>
              ) : carregandoMensagens ? (
                <div className={estilos.centro}><Carregando tamanho="2.25rem" texto="Carregando mensagens" atraso /></div>
              ) : mensagens.length === 0 ? (
                <p className={estilos.vazioChat}>Nenhuma mensagem ainda. Diga olá!</p>
              ) : (
                itens.map((it) =>
                  it.tipo === "dia" ? (
                    <div key={`d-${it.chave}`} className={estilos.dia}><span>{it.rotulo}</span></div>
                  ) : (
                    <div key={it.m.id} id={`msg-${it.m.id}`} className={`${estilos.linhaMsg} ${it.m.minha ? estilos.linhaMinha : ""} ${destaque === it.m.id ? estilos.destaque : ""}`}>
                      <div
                        className={`${estilos.balao} ${it.m.minha ? estilos.minha : ""} ${it.m.apagada ? estilos.apagada : ""} ${it.m.status === "falha" ? estilos.falhou : ""}`}
                        onContextMenu={(e) => { if (it.m.apagada || it.m.status === "enviando" || it.m.status === "falha") return; e.preventDefault(); abrirMenu(it.m.id); }}
                        onTouchStart={() => { if (it.m.apagada || it.m.status === "enviando" || it.m.status === "falha") return; soltarToque(); toque.current = setTimeout(() => { toque.current = null; abrirMenu(it.m.id); }, 450); }}
                        onTouchMove={soltarToque} onTouchEnd={soltarToque} onTouchCancel={soltarToque}
                      >
                        {!it.m.apagada && it.m.status !== "enviando" && it.m.status !== "falha" && (
                          <span className={estilos.menuBox} data-menu data-aberto={menu === it.m.id}>
                            <button type="button" className={estilos.abrirMenu} aria-label="Opções da mensagem" aria-haspopup="menu" aria-expanded={menu === it.m.id} onClick={() => (menu === it.m.id ? setMenu(null) : abrirMenu(it.m.id))}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                            </button>
                            {menu === it.m.id && (
                              <ul ref={mostrarMenu} className={`${estilos.menu} ${it.m.minha ? "" : estilos.menuEsq}`} role="menu">
                                <li><button type="button" role="menuitem" onClick={() => comecarResposta(it.m)}>Responder</button></li>
                                <li><button type="button" role="menuitem" onClick={() => { setMenu(null); setDados(it.m); }}>Dados da mensagem</button></li>
                                {it.m.texto.trim() && <li><button type="button" role="menuitem" onClick={() => copiar(it.m)}>Copiar</button></li>}
                                {it.m.anexo && !it.m.anexo.expirado && <li><button type="button" role="menuitem" onClick={() => { setMenu(null); void aoBaixar(it.m.id).then((ok) => { if (!ok) setAviso("Não foi possível baixar"); }); }}>Baixar</button></li>}
                                {it.m.minha && <li><button type="button" role="menuitem" onClick={() => comecarEdicao(it.m)}>Editar</button></li>}
                                {it.m.minha && <li><button type="button" role="menuitem" className={estilos.perigo} onClick={() => apagar(it.m)}>Apagar</button></li>}
                              </ul>
                            )}
                          </span>
                        )}
                        {it.m.resposta && !it.m.apagada && (
                          <button type="button" className={estilos.citacao} onClick={() => irParaOriginal(it.m.resposta!.id)} aria-label="Ir para a mensagem respondida">
                            {it.m.resposta.autor && <strong>{it.m.resposta.autor}</strong>}
                            <span>{it.m.resposta.texto}</span>
                          </button>
                        )}
                        {it.m.anexo && (it.m.anexo.expirado ? (
                          <div className={estilos.anexoExpirado}>
                            <Icone nome="documento" width={28} height={28} />
                            <span><strong>Arquivo expirado</strong><em>{it.m.anexo.nome}</em></span>
                          </div>
                        ) : ehImagem(it.m.anexo.tipo) ? (
                          <button type="button" className={estilos.anexoImagem} onClick={() => void aoBaixar(it.m.id, true)} aria-label={`Abrir imagem ${it.m.anexo.nome}`} title="Abrir imagem" disabled={it.m.status === "enviando"}>
                            {it.m.anexo.url ? <img src={it.m.anexo.url} alt={it.m.anexo.nome} loading="lazy" /> : <span className={estilos.anexoCarregando} />}
                          </button>
                        ) : ehVideo(it.m.anexo.tipo) ? (
                          <div className={estilos.anexoImagem}>
                            {it.m.anexo.url ? <video src={it.m.anexo.url} controls playsInline preload="metadata" aria-label={it.m.anexo.nome} /> : <span className={estilos.anexoCarregando} />}
                          </div>
                        ) : (
                          <button type="button" className={estilos.anexoArquivo} onClick={() => void aoBaixar(it.m.id).then((ok) => { if (!ok) setAviso("Não foi possível baixar"); })} aria-label={`Baixar ${it.m.anexo.nome}`} title="Baixar" disabled={it.m.status === "enviando"}>
                            <Icone nome="documento" width={28} height={28} />
                            <span><strong>{it.m.anexo.nome}</strong><em>{formatarTamanho(it.m.anexo.tamanho)}</em></span>
                          </button>
                        ))}
                        <p>
                          {it.m.apagada ? (it.m.minha ? "Você apagou esta mensagem" : "Esta mensagem foi apagada") : it.m.texto}
                          {/* Hora e tiques entram na última linha do texto quando cabem (como no WhatsApp). */}
                          <span className={estilos.rodape}>
                            {it.m.editadaEm && !it.m.apagada && <em>Editada</em>}
                            <time dateTime={it.m.criadoEm}>{hora(it.m.criadoEm)}</time>
                            {it.m.minha && !it.m.apagada && <Tiques status={it.m.status} />}
                          </span>
                        </p>
                        {it.m.status === "falha" && <button type="button" className={estilos.tentar} onClick={() => aoReenviar(it.m.id)}>Falha ao enviar. Tentar novamente</button>}
                      </div>
                    </div>
                  ),
                )
              )}
            </div>


            <form className={estilos.envio} onSubmit={enviar}>
              {respondendo && !editando && (
                <div className={estilos.respondendo}>
                  <div className={estilos.citacaoBarra}>
                    <strong>{respondendo.minha ? "Você" : ativa.nome}</strong>
                    <span>{respondendo.texto}</span>
                  </div>
                  <button type="button" className={estilos.icone} onClick={() => setRespondendo(null)} aria-label="Cancelar resposta" title="Cancelar resposta">
                    <Icone nome="fechar" width={18} height={18} />
                  </button>
                </div>
              )}
              {arquivo && !editando && (
                <div className={estilos.respondendo}>
                  {previa ? <img className={estilos.miniatura} src={previa} alt="" /> : <Icone nome={ehVideo(arquivo.type) ? "foto-video" : "documento"} width={28} height={28} />}
                  <div className={estilos.citacaoBarra}>
                    <strong>{arquivo.name}</strong>
                    <span>{formatarTamanho(arquivo.size)}</span>
                  </div>
                  <button type="button" className={estilos.icone} onClick={() => setArquivo(null)} aria-label="Remover arquivo" title="Remover arquivo">
                    <Icone nome="fechar" width={18} height={18} />
                  </button>
                </div>
              )}
              {(editando || aviso) && (
                <div className={estilos.avisos}>
                  {editando && <Aviso key={editando.id} rotuloFechar="Cancelar edição" aoFechar={() => { setEditando(null); setTexto(""); }}>Editando mensagem</Aviso>}
                  {aviso && <Aviso key={aviso} aoFechar={() => setAviso("")}>{aviso}</Aviso>}
                </div>
              )}
              <div className={estilos.entrada}>
                <input ref={entradaDocumento} type="file" hidden accept={TIPOS_DOCUMENTO.join(",")} onChange={(e) => { escolher(e.target.files?.[0]); e.target.value = ""; }} />
                <input ref={entradaMidia} type="file" hidden accept={TIPOS_MIDIA.join(",")} onChange={(e) => { escolher(e.target.files?.[0]); e.target.value = ""; }} />
                <input ref={entradaCamera} type="file" hidden accept="image/*" capture="environment" onChange={(e) => { escolher(e.target.files?.[0]); e.target.value = ""; }} />
                {!editando && (
                  <MenuAcoes
                    rotulo="Anexar"
                    paraCima
                    gatilho={<Icone nome="anexar-pdf" width={22} height={22} />}
                    itens={[
                      { id: "documento", rotulo: "Documento", icone: <Icone nome="documento" width={20} height={20} />, aoEscolher: abrirEntrada(entradaDocumento) },
                      { id: "midia", rotulo: "Fotos e vídeos", icone: <Icone nome="foto-video" width={20} height={20} />, aoEscolher: abrirEntrada(entradaMidia) },
                      { id: "camera", rotulo: "Câmera", icone: <Icone nome="camera" width={20} height={20} />, aoEscolher: abrirEntrada(entradaCamera) },
                    ]}
                  />
                )}
                <textarea ref={campo} rows={1} value={texto} onChange={(e) => { setTexto(e.target.value); aoDigitar(e.target.value.trim() !== ""); }} onKeyDown={teclas} onPaste={colar} placeholder={arquivo ? "Adicione uma legenda (opcional)" : "Digite uma mensagem"} aria-label="Mensagem" maxLength={2000} autoComplete="off" />
                <button type="submit" className={estilos.enviar} disabled={(!texto.trim() && !arquivo && !editando?.anexo) || enviando} aria-label={editando ? "Salvar edição" : "Enviar"}>
                  {enviando ? <Carregando tamanho="1.1rem" texto="" cor="herdar" /> : <Icone nome={editando ? "enviada" : "enviar"} width={20} height={20} />}
                </button>
              </div>
              {erro && <p className={estilos.erro} role="alert">{erro}</p>}
            </form>
          </>
        )}
      </section>

      {dados && (
        <div className={estilos.fundoDialogo} onMouseDown={() => setDados(null)}>
          <div className={estilos.dialogo} role="dialog" aria-modal="true" aria-label="Dados da mensagem" onMouseDown={(e) => e.stopPropagation()}>
            <header>
              <h2>Dados da mensagem</h2>
              <button type="button" className={estilos.icone} onClick={() => setDados(null)} aria-label="Fechar"><Icone nome="fechar" width={18} height={18} /></button>
            </header>
            <p className={estilos.previaDialogo}>{resumoMensagem(dados.texto, dados.anexo?.nome, dados.anexo?.tipo)}</p>
            <dl>
              <dt><Tiques status="enviada" /> Enviada</dt>
              <dd>{completo(dados.criadoEm)}</dd>
              {dados.minha && (
                <>
                  <dt><Tiques status="recebida" /> Recebida</dt>
                  <dd>{dados.recebidaEm ? completo(dados.recebidaEm) : "Ainda não"}</dd>
                  <dt><Tiques status="lida" /> Lida</dt>
                  <dd>{dados.lidaEm ? completo(dados.lidaEm) : "Ainda não"}</dd>
                </>
              )}
              {dados.editadaEm && (<><dt>Editada</dt><dd>{completo(dados.editadaEm)}</dd></>)}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
