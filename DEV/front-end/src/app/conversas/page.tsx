"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TelaConversas } from "./tela-conversas";
import type { BalaoDado, Pessoa, ResumoConversa, StatusEnvio } from "./tela-conversas";
import { lerCache, gravarCache } from "../../cache/cache-local";
import { meuIdLocal } from "../../supabase/meu-id";
import {
  apagarMensagemAction,
  editarMensagemAction,
  enviarMensagemAction,
  carregarInicioAction,
  listarMensagensAction,
  marcarLidasAction,
  marcarRecebidasAction,
} from "../../mensagens/acoes";
import type { Mensagem } from "../../mensagens/acoes";
import { useMensagensAoVivo } from "../../mensagens/use-mensagens-ao-vivo";

type Local = Mensagem & { falhou?: boolean };

export default function PaginaConversas() {
  const [meuId, setMeuId] = useState<string | null>(null);
  const [conversas, setConversas] = useState<ResumoConversa[]>([]);
  const [contatos, setContatos] = useState<Pessoa[]>([]);
  const [ativa, setAtiva] = useState<Pessoa | null>(null);
  const [mensagens, setMensagens] = useState<Local[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  const ativaRef = useRef<Pessoa | null>(null);
  ativaRef.current = ativa;

  const aplicarInicio = useCallback((dados: Awaited<ReturnType<typeof carregarInicioAction>>) => {
    setConversas(dados.conversas.map((c) => ({
      id: c.contato_id, nome: c.nome, arroba: c.arroba, fotoUrl: c.foto_url,
      ultimaTexto: c.ultima_texto, ultimaEm: c.ultima_em, naoLidas: c.nao_lidas,
      ultimaMinha: c.ultima_minha, ultimaStatus: c.ultima_status,
    })));
    setContatos(dados.contatos.map((p) => ({ id: p.id, nome: p.nome, arroba: p.arroba, fotoUrl: p.foto_url })));
  }, []);

  const carregarLista = useCallback(async () => {
    const dados = await carregarInicioAction(); // também marca como recebidas as mensagens que chegaram
    gravarCache("inicio", dados);
    aplicarInicio(dados);
  }, [aplicarInicio]);

  useEffect(() => {
    meuIdLocal().then(setMeuId);
    // Mostra na hora o que já foi carregado antes e atualiza por trás.
    const guardado = lerCache<Awaited<ReturnType<typeof carregarInicioAction>>>("inicio");
    if (guardado) { aplicarInicio(guardado); setCarregando(false); }
    carregarLista().finally(() => setCarregando(false));
  }, [carregarLista, aplicarInicio]);

  // Vindo do perfil de alguém (/conversas?com=@usuario): abre a conversa com essa pessoa.
  const abrirDoLink = useRef(false);
  useEffect(() => {
    if (abrirDoLink.current || carregando) return;
    abrirDoLink.current = true;
    const com = new URLSearchParams(window.location.search).get("com");
    if (!com) return;
    const alvo = com.replace(/^@/, "");
    const pessoa = [...conversas, ...contatos].find((p) => p.arroba === alvo);
    if (pessoa) abrir(pessoa);
  }, [carregando]);

  const aoReceber = useCallback((m: Mensagem) => {
    marcarRecebidasAction();
    if (ativaRef.current?.id === m.remetente_id) {
      setMensagens((atual) => (atual.some((x) => x.id === m.id) ? atual : [...atual, m]));
      marcarLidasAction(m.remetente_id);
    }
    carregarLista();
  }, [carregarLista]);

  // Recebida/lida/editada/apagada: troca a mensagem na tela sem recarregar tudo.
  const aoAtualizar = useCallback((m: Mensagem) => {
    setMensagens((atual) => atual.map((x) => (x.id === m.id ? m : x)));
    carregarLista();
  }, [carregarLista]);
  useMensagensAoVivo(meuId, aoReceber, aoAtualizar);

  async function abrir(pessoa: Pessoa) {
    setAtiva(pessoa);
    setMensagens([]);
    setCarregandoMensagens(true);
    const lista = await listarMensagensAction(pessoa.id);
    if (ativaRef.current?.id !== pessoa.id) return; // trocou de conversa enquanto carregava
    setMensagens(lista);
    setCarregandoMensagens(false);
    await marcarLidasAction(pessoa.id);
    carregarLista();
  }

  function voltar() {
    setAtiva(null);
    carregarLista();
  }

  async function enviar(texto: string) {
    if (!ativa || !meuId) return "Escolha uma conversa.";
    const provisoria: Local = {
      id: `tmp-${Date.now()}`, remetente_id: meuId, destinatario_id: ativa.id, texto,
      criado_em: new Date().toISOString(), lida_em: null, recebida_em: null, editada_em: null, apagada_em: null,
    };
    setMensagens((atual) => [...atual, provisoria]);
    const r = await enviarMensagemAction(ativa.id, texto);
    if (!r.ok) {
      setMensagens((atual) => atual.filter((x) => x.id !== provisoria.id));
      return r.mensagem;
    }
    setMensagens((atual) => {
      const real = atual.some((x) => x.id === r.mensagem.id);
      return real ? atual.filter((x) => x.id !== provisoria.id) : atual.map((x) => (x.id === provisoria.id ? r.mensagem : x));
    });
    carregarLista();
    return null;
  }

  async function editar(id: string, texto: string) {
    const ok = await editarMensagemAction(id, texto);
    if (ok) {
      setMensagens((atual) => atual.map((x) => (x.id === id ? { ...x, texto, editada_em: new Date().toISOString() } : x)));
      carregarLista();
    }
    return ok;
  }

  async function apagar(id: string) {
    const ok = await apagarMensagemAction(id);
    if (ok) {
      setMensagens((atual) => atual.map((x) => (x.id === id ? { ...x, texto: "Mensagem apagada", apagada_em: new Date().toISOString() } : x)));
      carregarLista();
    }
    return ok;
  }

  const baloes: BalaoDado[] = mensagens.map((m) => {
    const minha = m.remetente_id === meuId;
    const status: StatusEnvio = m.id.startsWith("tmp-") ? "enviando" : m.lida_em ? "lida" : m.recebida_em ? "recebida" : "enviada";
    return {
      id: m.id, minha, texto: m.texto, criadoEm: m.criado_em,
      recebidaEm: m.recebida_em, lidaEm: m.lida_em, editadaEm: m.editada_em,
      apagada: !!m.apagada_em, status,
    };
  });
  const comConversa = new Set(conversas.map((c) => c.id));
  const novos = contatos.filter((c) => !comConversa.has(c.id));

  return (
    <TelaConversas
      carregandoLista={carregando}
      carregandoMensagens={carregandoMensagens}
      conversas={conversas}
      novos={novos}
      ativa={ativa}
      mensagens={baloes}
      aoAbrir={abrir}
      aoVoltar={voltar}
      aoEnviar={enviar}
      aoEditar={editar}
      aoApagar={apagar}
    />
  );
}
