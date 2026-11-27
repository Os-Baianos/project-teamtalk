"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listarContatosAction } from "../../../../../front-end/src/contatos/acoes";
import {
  enviarMensagemAction,
  listarConversasAction,
  listarMensagensAction,
  marcarLidasAction,
  marcarRecebidasAction,
  meuIdAction,
} from "../../../../../front-end/src/mensagens/acoes";
import type { Mensagem } from "../../../../../front-end/src/mensagens/acoes";
import { useMensagensAoVivo } from "../../../../../front-end/src/mensagens/use-mensagens-ao-vivo";
import { TelaConversas } from "./tela-conversas";
import type { BalaoDado, Pessoa, ResumoConversa } from "./tela-conversas";

type MensagemLocal = Mensagem & { falhou?: boolean };

export default function PaginaConversas() {
  const [meuId, setMeuId] = useState<string | null>(null);
  const [conversas, setConversas] = useState<ResumoConversa[]>([]);
  const [contatos, setContatos] = useState<Pessoa[]>([]);
  const [ativa, setAtiva] = useState<Pessoa | null>(null);
  const [mensagens, setMensagens] = useState<MensagemLocal[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [erroLista, setErroLista] = useState(false);
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  const [erroHistorico, setErroHistorico] = useState(false);
  const ativaRef = useRef<Pessoa | null>(null);
  ativaRef.current = ativa;

  const carregarLista = useCallback(async () => {
    setErroLista(false);
    try {
      const [lista, pessoas] = await Promise.all([listarConversasAction(), listarContatosAction()]);
      setConversas(lista.map((c) => ({
        id: c.contato_id,
        nome: c.nome,
        arroba: c.arroba,
        fotoUrl: c.foto_url,
        ultimaTexto: c.ultima_texto,
        ultimaEm: c.ultima_em,
        naoLidas: c.nao_lidas,
        ultimaMinha: c.ultima_minha,
        ultimaStatus: c.ultima_status,
      })));
      setContatos(pessoas.map((p) => ({ id: p.id, nome: p.nome, arroba: p.arroba, fotoUrl: p.foto_url })));
    } catch {
      setErroLista(true);
    }
  }, []);

  useEffect(() => {
    void meuIdAction().then(setMeuId);
    void marcarRecebidasAction();
    void carregarLista().finally(() => setCarregandoLista(false));
  }, [carregarLista]);

  async function abrir(pessoa: Pessoa) {
    setAtiva(pessoa);
    setMensagens([]);
    setErroHistorico(false);
    setCarregandoMensagens(true);
    try {
      const lista = await listarMensagensAction(pessoa.id);
      if (ativaRef.current?.id !== pessoa.id) return;
      setMensagens(lista);
      await marcarLidasAction(pessoa.id);
      void carregarLista();
    } catch {
      if (ativaRef.current?.id === pessoa.id) setErroHistorico(true);
    } finally {
      if (ativaRef.current?.id === pessoa.id) setCarregandoMensagens(false);
    }
  }

  const aoReceber = useCallback((mensagem: Mensagem) => {
    void marcarRecebidasAction();
    if (ativaRef.current?.id === mensagem.remetente_id) {
      setMensagens((atual) => (atual.some((m) => m.id === mensagem.id) ? atual : [...atual, mensagem]));
      void marcarLidasAction(mensagem.remetente_id);
    }
    void carregarLista();
  }, [carregarLista]);

  const aoAtualizar = useCallback((mensagem: Mensagem) => {
    setMensagens((atual) => atual.map((m) => m.id === mensagem.id ? mensagem : m));
    void carregarLista();
  }, [carregarLista]);

  useMensagensAoVivo(meuId, aoReceber, aoAtualizar);

  async function enviar(texto: string): Promise<string | null> {
    if (!ativa || !meuId) return "Escolha uma conversa.";
    const provisoria: MensagemLocal = {
      id: `tmp-${Date.now()}`,
      remetente_id: meuId,
      destinatario_id: ativa.id,
      texto,
      criado_em: new Date().toISOString(),
      lida_em: null,
      recebida_em: null,
      editada_em: null,
      apagada_em: null,
    };
    setMensagens((atual) => [...atual, provisoria]);
    const resultado = await enviarMensagemAction(ativa.id, texto);
    if (!resultado.ok) {
      setMensagens((atual) => atual.map((m) => m.id === provisoria.id ? { ...m, falhou: true } : m));
      return resultado.mensagem;
    }
    setMensagens((atual) => {
      if (atual.some((m) => m.id === resultado.mensagem.id)) return atual.filter((m) => m.id !== provisoria.id);
      return atual.map((m) => m.id === provisoria.id ? resultado.mensagem : m);
    });
    void carregarLista();
    return null;
  }

  async function reenviar(id: string) {
    const falha = mensagens.find((m) => m.id === id);
    if (!falha || !ativa) return "Não foi possível reenviar esta mensagem.";
    setMensagens((atual) => atual.map((m) => m.id === id ? { ...m, falhou: false } : m));
    const resultado = await enviarMensagemAction(ativa.id, falha.texto);
    if (!resultado.ok) {
      setMensagens((atual) => atual.map((m) => m.id === id ? { ...m, falhou: true } : m));
      return resultado.mensagem;
    }
    setMensagens((atual) => atual.map((m) => m.id === id ? resultado.mensagem : m));
    void carregarLista();
    return null;
  }

  const baloes: BalaoDado[] = mensagens.map((m) => ({
    id: m.id,
    minha: m.remetente_id === meuId,
    texto: m.texto,
    criadoEm: m.criado_em,
    status: m.falhou ? "falha" : m.id.startsWith("tmp-") ? "enviando" : m.lida_em ? "lida" : m.recebida_em ? "recebida" : "enviada",
  }));
  const idsComConversa = new Set(conversas.map((c) => c.id));
  const novos = contatos.filter((c) => !idsComConversa.has(c.id));

  return (
    <TelaConversas
      carregandoLista={carregandoLista}
      erroLista={erroLista}
      aoTentarCarregarLista={() => { setCarregandoLista(true); void carregarLista().finally(() => setCarregandoLista(false)); }}
      carregandoMensagens={carregandoMensagens}
      erroHistorico={erroHistorico}
      aoTentarCarregarHistorico={() => ativa && void abrir(ativa)}
      conversas={conversas}
      novos={novos}
      ativa={ativa}
      mensagens={baloes}
      aoAbrir={abrir}
      aoVoltar={() => { setAtiva(null); void carregarLista(); }}
      aoEnviar={enviar}
      aoReenviar={reenviar}
    />
  );
}
