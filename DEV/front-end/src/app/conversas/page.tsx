"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TelaConversas } from "./tela-conversas";
import type { BalaoDado, Pessoa, ResumoConversa } from "./tela-conversas";
import { listarContatosAction } from "../../contatos/acoes";
import {
  enviarMensagemAction,
  listarConversasAction,
  listarMensagensAction,
  marcarLidasAction,
  meuIdAction,
} from "../../mensagens/acoes";
import type { Mensagem } from "../../mensagens/acoes";
import { useMensagensAoVivo } from "../../mensagens/use-mensagens-ao-vivo";

export default function PaginaConversas() {
  const [meuId, setMeuId] = useState<string | null>(null);
  const [conversas, setConversas] = useState<ResumoConversa[]>([]);
  const [contatos, setContatos] = useState<Pessoa[]>([]);
  const [ativa, setAtiva] = useState<Pessoa | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const ativaRef = useRef<Pessoa | null>(null);
  ativaRef.current = ativa;

  const carregarLista = useCallback(async () => {
    const [lista, pessoas] = await Promise.all([listarConversasAction(), listarContatosAction()]);
    setConversas(lista.map((c) => ({
      id: c.contato_id, nome: c.nome, arroba: c.arroba,
      ultimaTexto: c.ultima_texto, ultimaEm: c.ultima_em, naoLidas: c.nao_lidas,
    })));
    setContatos(pessoas);
  }, []);

  useEffect(() => {
    meuIdAction().then(setMeuId);
    carregarLista().finally(() => setCarregando(false));
  }, [carregarLista]);

  const aoReceber = useCallback((m: Mensagem) => {
    if (ativaRef.current?.id === m.remetente_id) {
      setMensagens((atual) => (atual.some((x) => x.id === m.id) ? atual : [...atual, m]));
      marcarLidasAction(m.remetente_id);
    }
    carregarLista();
  }, [carregarLista]);
  useMensagensAoVivo(meuId, aoReceber);

  async function abrir(pessoa: Pessoa) {
    setAtiva(pessoa);
    setMensagens([]);
    setMensagens(await listarMensagensAction(pessoa.id));
    await marcarLidasAction(pessoa.id);
    carregarLista();
  }

  function voltar() {
    setAtiva(null);
    carregarLista();
  }

  async function enviar(texto: string) {
    if (!ativa) return "Escolha uma conversa.";
    const r = await enviarMensagemAction(ativa.id, texto);
    if (!r.ok) return r.mensagem;
    setMensagens((atual) => [...atual, r.mensagem]);
    return null;
  }

  const baloes: BalaoDado[] = mensagens.map((m) => ({
    id: m.id, minha: m.remetente_id === meuId, texto: m.texto, criadoEm: m.criado_em,
  }));
  const comConversa = new Set(conversas.map((c) => c.id));
  const novos = contatos.filter((c) => !comConversa.has(c.id));

  return (
    <TelaConversas
      carregando={carregando}
      conversas={conversas}
      novos={novos}
      ativa={ativa}
      mensagens={baloes}
      aoAbrir={abrir}
      aoVoltar={voltar}
      aoEnviar={enviar}
    />
  );
}
