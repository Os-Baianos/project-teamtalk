"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listarContatosAction } from "../front-end/src/contatos/acoes";
import type { ContatoDado } from "../front-end/src/contatos/acoes";
import {
  enviarMensagemAction,
  listarConversasAction,
  listarMensagensAction,
  marcarLidasAction,
  meuIdAction,
} from "../front-end/src/mensagens/acoes";
import type { Mensagem } from "../front-end/src/mensagens/acoes";
import { useMensagensAoVivo } from "../front-end/src/mensagens/use-mensagens-ao-vivo";
import { TelaConversas } from "./tela-conversas";
import type { ConversaDado } from "./tela-conversas";

export function PaginaConversas() {
  const [meuId, setMeuId] = useState<string | null>(null);
  const [conversas, setConversas] = useState<ConversaDado[]>([]);
  const [contatos, setContatos] = useState<ContatoDado[]>([]);
  const [contatoAtivo, setContatoAtivo] = useState<ContatoDado | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [erroLista, setErroLista] = useState<string | null>(null);
  const [erroHistorico, setErroHistorico] = useState<string | null>(null);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const contatoAtivoRef = useRef<ContatoDado | null>(null);
  contatoAtivoRef.current = contatoAtivo;

  const carregarLista = useCallback(async (mostrarCarregamento = false) => {
    if (mostrarCarregamento) setCarregandoLista(true);
    setErroLista(null);
    try {
      const [lista, pessoas] = await Promise.all([listarConversasAction(), listarContatosAction()]);
      setConversas(lista);
      setContatos(pessoas);
    } catch {
      setErroLista("Não foi possível carregar suas conversas. Verifique sua conexão ou tente novamente mais tarde.");
    } finally {
      setCarregandoLista(false);
    }
  }, []);

  useEffect(() => {
    void meuIdAction().then(setMeuId);
    void carregarLista(true);
  }, [carregarLista]);

  const aoReceber = useCallback((mensagem: Mensagem) => {
    if (contatoAtivoRef.current?.id === mensagem.remetente_id) {
      setMensagens((atuais) => atuais.some((m) => m.id === mensagem.id) ? atuais : [...atuais, mensagem]);
      void marcarLidasAction(mensagem.remetente_id);
    }
    void carregarLista();
  }, [carregarLista]);
  useMensagensAoVivo(meuId, aoReceber);

  async function abrirContato(contato: ContatoDado) {
    contatoAtivoRef.current = contato;
    setContatoAtivo(contato);
    setMensagens([]);
    setCarregandoHistorico(true);
    setErroHistorico(null);
    setErroEnvio(null);
    try {
      const historico = await listarMensagensAction(contato.id);
      if (contatoAtivoRef.current?.id !== contato.id) return;
      setMensagens(historico);
      await marcarLidasAction(contato.id);
      void carregarLista();
    } catch {
      if (contatoAtivoRef.current?.id === contato.id) setErroHistorico("Não foi possível carregar as mensagens. Tente novamente.");
    } finally {
      if (contatoAtivoRef.current?.id === contato.id) setCarregandoHistorico(false);
    }
  }

  async function recarregarHistorico() {
    if (!contatoAtivo) return;
    const contato = contatoAtivo;
    setCarregandoHistorico(true);
    setErroHistorico(null);
    try {
      const historico = await listarMensagensAction(contato.id);
      if (contatoAtivoRef.current?.id !== contato.id) return;
      setMensagens(historico);
      await marcarLidasAction(contato.id);
    } catch {
      if (contatoAtivoRef.current?.id === contato.id) setErroHistorico("Não foi possível carregar as mensagens. Tente novamente.");
    } finally {
      if (contatoAtivoRef.current?.id === contato.id) setCarregandoHistorico(false);
    }
  }

  async function enviar(texto: string) {
    if (!contatoAtivo) return false;
    const contato = contatoAtivo;
    setErroEnvio(null);
    const resultado = await enviarMensagemAction(contato.id, texto);
    if (!resultado.ok) {
      if (contatoAtivoRef.current?.id === contato.id) setErroEnvio(resultado.mensagem);
      return false;
    }
    if (contatoAtivoRef.current?.id === contato.id) {
      setMensagens((atuais) => atuais.some((m) => m.id === resultado.mensagem.id) ? atuais : [...atuais, resultado.mensagem]);
    }
    void carregarLista();
    return true;
  }

  return <TelaConversas
    conversas={conversas}
    contatos={contatos}
    mensagens={mensagens}
    meuId={meuId}
    contatoAtivo={contatoAtivo}
    carregandoLista={carregandoLista}
    carregandoHistorico={carregandoHistorico}
    erroLista={erroLista}
    erroHistorico={erroHistorico}
    erroEnvio={erroEnvio}
    aoAbrirContato={abrirContato}
    aoRecarregarLista={() => void carregarLista(true)}
    aoRecarregarHistorico={() => void recarregarHistorico()}
    aoEnviar={enviar}
    aoVoltar={() => { contatoAtivoRef.current = null; setContatoAtivo(null); void carregarLista(); }}
  />;
}
