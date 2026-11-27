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
} from "../../mensagens/acoes";
import { useDigitando } from "../../mensagens/use-digitando";
import { lerInicio, lerMensagens, marcarLidas, marcarRecebidas } from "../../dados/leituras";
import type { Mensagem } from "../../mensagens/acoes";
import { useMensagensAoVivo } from "../../mensagens/use-mensagens-ao-vivo";
import { criarClienteNavegador } from "../../supabase/navegador";
import { anexoExpirado, ehImagem, ehVideo, nomeSeguro, resumoMensagem, validarArquivo } from "../../mensagens/anexos";
import { limparAnexosVencidos } from "../../mensagens/limpar-anexos";
import type { Anexo } from "../../mensagens/anexos";

type Local = Mensagem & { falhou?: boolean };

export default function PaginaConversas() {
  const [meuId, setMeuId] = useState<string | null>(null);
  const [conversas, setConversas] = useState<ResumoConversa[]>([]);
  const [contatos, setContatos] = useState<Pessoa[]>([]);
  const [ativa, setAtiva] = useState<Pessoa | null>(null);
  const [mensagens, setMensagens] = useState<Local[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  const [erroLista, setErroLista] = useState(false);
  const [erroHistorico, setErroHistorico] = useState(false);
  const ativaRef = useRef<Pessoa | null>(null);
  ativaRef.current = ativa;
  /** Endereços (temporários) das imagens, por caminho no armazenamento. */
  const [urls, setUrls] = useState<Record<string, string>>({});
  const pedidas = useRef(new Set<string>());
  /** Arquivos de mensagens que ainda não foram enviadas (para "Tentar novamente"). */
  const pendentes = useRef(new Map<string, { arquivo: File; anexo?: Anexo }>());

  useEffect(() => {
    const faltam = mensagens
      .filter((m) => m.anexo_caminho && !m.apagada_em && (ehImagem(m.anexo_tipo) || ehVideo(m.anexo_tipo)) && !anexoExpirado(m.criado_em, m.anexo_caminho) && !m.anexo_caminho.startsWith("tmp/") && !pedidas.current.has(m.anexo_caminho))
      .map((m) => m.anexo_caminho as string);
    if (faltam.length === 0) return;
    faltam.forEach((c) => pedidas.current.add(c));
    criarClienteNavegador().storage.from("anexos").createSignedUrls(faltam, 3600).then(({ data }) => {
      if (!data) { faltam.forEach((c) => pedidas.current.delete(c)); return; }
      setUrls((atual) => {
        const novo = { ...atual };
        for (const d of data) if (d.path && d.signedUrl) novo[d.path] = d.signedUrl;
        return novo;
      });
    });
  }, [mensagens]);

  const aplicarInicio = useCallback((dados: Awaited<ReturnType<typeof lerInicio>>) => {
    setConversas(dados.conversas.map((c) => ({
      id: c.contato_id, nome: c.nome, arroba: c.arroba, fotoUrl: c.foto_url,
      ultimaTexto: c.ultima_texto, ultimaEm: c.ultima_em, naoLidas: c.nao_lidas,
      ultimaMinha: c.ultima_minha, ultimaStatus: c.ultima_status,
    })));
    setContatos(dados.contatos.map((p) => ({ id: p.id, nome: p.nome, arroba: p.arroba, fotoUrl: p.foto_url })));
  }, []);

  const carregarLista = useCallback(async () => {
    try {
      const dados = await lerInicio(); // também marca como recebidas as mensagens que chegaram
      gravarCache("inicio", dados);
      aplicarInicio(dados);
      setErroLista(false);
    } catch {
      setErroLista(true);
    }
  }, [aplicarInicio]);

  // Apaga do servidor os meus arquivos com mais de 7 dias (o servidor também faz isso uma vez por dia).
  useEffect(() => { if (meuId) void limparAnexosVencidos(meuId); }, [meuId]);

  useEffect(() => {
    meuIdLocal().then(setMeuId);
    // Mostra na hora o que já foi carregado antes e atualiza por trás.
    const guardado = lerCache<Awaited<ReturnType<typeof lerInicio>>>("inicio");
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

  const { digitando, avisar: avisarDigitando, parar: pararDigitando } = useDigitando(meuId, ativa?.id ?? null);

  const aoReceber = useCallback((m: Mensagem) => {
    marcarRecebidas();
    if (ativaRef.current?.id === m.remetente_id) {
      pararDigitando();
      setMensagens((atual) => (atual.some((x) => x.id === m.id) ? atual : [...atual, m]));
      marcarLidas(m.remetente_id);
    }
    carregarLista();
  }, [carregarLista, pararDigitando]);

  // Recebida/lida/editada/apagada: troca a mensagem na tela sem recarregar tudo.
  const aoAtualizar = useCallback((m: Mensagem) => {
    setMensagens((atual) => atual.map((x) => (x.id === m.id ? m : x)));
    carregarLista();
  }, [carregarLista]);
  useMensagensAoVivo(meuId, aoReceber, aoAtualizar);

  // Mantém guardada a cópia da conversa aberta (só mensagens já confirmadas).
  useEffect(() => {
    if (!ativa || carregandoMensagens) return;
    gravarCache(`msgs:${ativa.id}`, mensagens.filter((m) => !m.id.startsWith("tmp-") && !m.falhou));
  }, [mensagens, ativa, carregandoMensagens]);

  async function abrir(pessoa: Pessoa) {
    setAtiva(pessoa);
    setErroHistorico(false);
    // Se já temos as mensagens guardadas, mostra na hora (sem círculo) e atualiza por trás.
    const guardadas = lerCache<Mensagem[]>(`msgs:${pessoa.id}`);
    setMensagens(guardadas ?? []);
    setCarregandoMensagens(!guardadas);
    try {
      const lista = await lerMensagens(pessoa.id);
      if (ativaRef.current?.id !== pessoa.id) return; // trocou de conversa enquanto carregava
      setMensagens(lista);
      setCarregandoMensagens(false);
      marcarLidas(pessoa.id).then(carregarLista).catch(() => {});
    } catch {
      if (ativaRef.current?.id === pessoa.id && !guardadas) setErroHistorico(true);
    } finally {
      if (ativaRef.current?.id === pessoa.id) setCarregandoMensagens(false);
    }
  }

  function voltar() {
    setAtiva(null);
    carregarLista();
  }

  /** Sobe o arquivo (se houver) direto para o armazenamento e depois envia a mensagem. */
  async function subirEEnviar(tmpId: string, contatoId: string, texto: string, respondeA: string | null, arquivo: File | null, jaSubido?: Anexo) {
    let anexo = jaSubido ?? null;
    if (arquivo && !anexo) {
      const caminho = `${meuId}/${crypto.randomUUID()}-${nomeSeguro(arquivo.name)}`;
      const { error } = await criarClienteNavegador().storage.from("anexos").upload(caminho, arquivo, { contentType: arquivo.type });
      if (error) return null;
      anexo = { caminho, nome: arquivo.name.slice(0, 200), tipo: arquivo.type, tamanho: arquivo.size };
      const guardado = pendentes.current.get(tmpId);
      if (guardado) guardado.anexo = anexo;
    }
    return enviarMensagemAction(contatoId, texto, respondeA, anexo);
  }

  function concluir(tmpId: string, mensagem: Mensagem) {
    pendentes.current.delete(tmpId);
    if (mensagem.anexo_caminho) pedidas.current.add(mensagem.anexo_caminho); // já temos a imagem na tela
    setUrls((atual) => {
      const antigo = atual[`tmp/${tmpId}`];
      return antigo && mensagem.anexo_caminho ? { ...atual, [mensagem.anexo_caminho]: antigo } : atual;
    });
    setMensagens((atual) => {
      const real = atual.some((x) => x.id === mensagem.id);
      return real ? atual.filter((x) => x.id !== tmpId) : atual.map((x) => (x.id === tmpId ? mensagem : x));
    });
    carregarLista();
  }

  async function enviar(texto: string, respondeA: string | null = null, arquivo: File | null = null) {
    if (!ativa || !meuId) return "Escolha uma conversa.";
    if (arquivo) { const motivo = validarArquivo(arquivo); if (motivo) return motivo; }
    const tmpId = `tmp-${Date.now()}`;
    const provisoria: Local = {
      id: tmpId, remetente_id: meuId, destinatario_id: ativa.id, texto,
      criado_em: new Date().toISOString(), lida_em: null, recebida_em: null, editada_em: null, apagada_em: null, responde_a: respondeA,
      ...(arquivo ? { anexo_caminho: `tmp/${tmpId}`, anexo_nome: arquivo.name, anexo_tipo: arquivo.type, anexo_tamanho: arquivo.size } : {}),
    };
    if (arquivo) {
      pendentes.current.set(tmpId, { arquivo });
      if (ehImagem(arquivo.type) || ehVideo(arquivo.type)) setUrls((atual) => ({ ...atual, [`tmp/${tmpId}`]: URL.createObjectURL(arquivo) }));
    }
    setMensagens((atual) => [...atual, provisoria]);
    const r = await subirEEnviar(tmpId, ativa.id, texto, respondeA, arquivo);
    if (!r || !r.ok) {
      // A mensagem fica na conversa marcada como falha, com "Tentar novamente".
      setMensagens((atual) => atual.map((x) => (x.id === tmpId ? { ...x, falhou: true } : x)));
      return null;
    }
    concluir(tmpId, r.mensagem);
    return null;
  }

  async function reenviar(id: string) {
    const falha = mensagens.find((m) => m.id === id);
    if (!falha || !ativa) return;
    setMensagens((atual) => atual.map((x) => (x.id === id ? { ...x, falhou: false } : x)));
    const guardado = pendentes.current.get(id);
    const r = await subirEEnviar(id, ativa.id, falha.texto, falha.responde_a ?? null, guardado?.arquivo ?? null, guardado?.anexo);
    if (!r || !r.ok) {
      setMensagens((atual) => atual.map((x) => (x.id === id ? { ...x, falhou: true } : x)));
      return;
    }
    concluir(id, r.mensagem);
  }

  /** Baixa o arquivo com o nome original (link temporário só para este clique); imagens podem só abrir. */
  async function baixar(id: string, visualizar = false) {
    const m = mensagens.find((x) => x.id === id);
    if (!m?.anexo_caminho || !m.anexo_nome || anexoExpirado(m.criado_em, m.anexo_caminho)) return false;
    const aberta = urls[m.anexo_caminho];
    if (visualizar && aberta) { window.open(aberta, "_blank", "noopener"); return true; }
    const { data } = await criarClienteNavegador().storage.from("anexos").createSignedUrl(m.anexo_caminho, 60, { download: m.anexo_nome });
    if (!data?.signedUrl) return false;
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.rel = "noopener";
    a.click();
    return true;
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
      setMensagens((atual) => atual.map((x) => (x.id === id ? { ...x, texto: "Mensagem apagada", apagada_em: new Date().toISOString(), anexo_caminho: null, anexo_nome: null, anexo_tipo: null, anexo_tamanho: null } : x)));
      carregarLista();
    }
    return ok;
  }

  const baloes: BalaoDado[] = mensagens.map((m) => {
    const minha = m.remetente_id === meuId;
    const status: StatusEnvio = m.falhou ? "falha" : m.id.startsWith("tmp-") ? "enviando" : m.lida_em ? "lida" : m.recebida_em ? "recebida" : "enviada";
    const original = m.responde_a ? mensagens.find((x) => x.id === m.responde_a) : undefined;
    const resposta = m.responde_a
      ? {
          id: m.responde_a,
          autor: original ? (original.remetente_id === meuId ? "Você" : ativa?.nome ?? "") : "",
          texto: original ? resumoMensagem(original.texto, original.anexo_nome, original.anexo_tipo) || "Mensagem indisponível" : "Mensagem indisponível",
        }
      : null;
    return {
      id: m.id, minha, texto: m.texto, criadoEm: m.criado_em, resposta,
      recebidaEm: m.recebida_em, lidaEm: m.lida_em, editadaEm: m.editada_em,
      apagada: !!m.apagada_em, status,
      anexo: m.anexo_nome && !m.apagada_em
        ? {
            nome: m.anexo_nome, tipo: m.anexo_tipo ?? "", tamanho: m.anexo_tamanho ?? 0,
            expirado: anexoExpirado(m.criado_em, m.anexo_caminho),
            url: m.anexo_caminho ? urls[m.anexo_caminho] ?? null : null,
          }
        : null,
    };
  });
  const comConversa = new Set(conversas.map((c) => c.id));
  const novos = contatos.filter((c) => !comConversa.has(c.id));

  return (
    <TelaConversas
      carregandoLista={carregando}
      carregandoMensagens={carregandoMensagens}
      erroLista={erroLista}
      aoTentarLista={() => { setCarregando(true); carregarLista().finally(() => setCarregando(false)); }}
      erroHistorico={erroHistorico}
      aoTentarHistorico={() => { if (ativa) void abrir(ativa); }}
      aoReenviar={reenviar}
      conversas={conversas}
      novos={novos}
      ativa={ativa}
      mensagens={baloes}
      aoAbrir={abrir}
      aoVoltar={voltar}
      aoEnviar={enviar}
      digitando={digitando}
      aoDigitar={avisarDigitando}
      aoEditar={editar}
      aoApagar={apagar}
      aoBaixar={baixar}
    />
  );
}
