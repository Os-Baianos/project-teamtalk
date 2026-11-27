"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TelaConversas } from "../conversas/tela-conversas";
import type { BalaoDado, Pessoa, ResumoConversa, StatusEnvio } from "../conversas/tela-conversas";
import { meuIdLocal } from "../../supabase/meu-id";
import { apagarMensagemAction, editarMensagemAction } from "../../mensagens/acoes";
import type { Mensagem } from "../../mensagens/acoes";
import { criarClienteNavegador } from "../../supabase/navegador";
import { anexoExpirado, ehImagem, ehVideo, nomeSeguro, resumoMensagem, validarArquivo } from "../../mensagens/anexos";
import type { Anexo } from "../../mensagens/anexos";
import { souDevAction } from "../../dev/acoes";
import { enviarMensagemGrupoAction } from "../../grupos/acoes";
import { useExtras } from "../../mensagens/use-extras";
import { criarEnqueteAction, enviarContatoAction } from "../../mensagens/extras-acoes";
import { lerContatos } from "../../dados/leituras";
import { lerAutores, lerGrupos, lerMembros, lerMensagensGrupo, marcarLidoGrupo } from "../../grupos/leituras";
import { useGruposAoVivo } from "../../grupos/use-grupos-ao-vivo";
import { InfoGrupo } from "../../grupos/info-grupo";
import type { GrupoResumo, MembroGrupo } from "../../grupos/tipos";

type Local = Mensagem & { falhou?: boolean };
type Autores = Record<string, { nome: string; foto_url: string | null }>;

export default function PaginaComunidades() {
  const [meuId, setMeuId] = useState<string | null>(null);
  const [souAdmin, setSouAdmin] = useState(false);
  const [grupos, setGrupos] = useState<GrupoResumo[]>([]);
  const [ativaId, setAtivaId] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Local[]>([]);
  const [membros, setMembros] = useState<MembroGrupo[]>([]);
  const [autores, setAutores] = useState<Autores>({});
  const [carregando, setCarregando] = useState(true);
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  const [erroLista, setErroLista] = useState(false);
  const [erroHistorico, setErroHistorico] = useState(false);
  const [info, setInfo] = useState(false);
  const ativaRef = useRef<string | null>(null);
  ativaRef.current = ativaId;
  const [urls, setUrls] = useState<Record<string, string>>({});
  const pedidas = useRef(new Set<string>());
  const pendentes = useRef(new Map<string, { arquivo: File; anexo?: Anexo }>());

  const ativa = grupos.find((g) => g.id === ativaId) ?? null;

  // Endereços temporários de fotos e vídeos.
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

  const carregarLista = useCallback(async () => {
    try { setGrupos(await lerGrupos()); setErroLista(false); }
    catch { setErroLista(true); }
  }, []);

  const carregarMembros = useCallback(async (id: string) => {
    try { const lista = await lerMembros(id); if (ativaRef.current === id) setMembros(lista); } catch { /* mantém a lista anterior */ }
  }, []);

  async function carregarAutores(lista: Mensagem[]) {
    const falta = [...new Set(lista.map((m) => m.remetente_id))];
    if (falta.length === 0) return;
    const novos = await lerAutores(falta);
    setAutores((a) => ({ ...a, ...novos }));
  }

  useEffect(() => {
    meuIdLocal().then(setMeuId);
    souDevAction().then(setSouAdmin).catch(() => {});
    carregarLista().finally(() => setCarregando(false));
  }, [carregarLista]);

  const abrir = useCallback(async (g: { id: string }) => {
    setAtivaId(g.id);
    setErroHistorico(false);
    setMensagens([]);
    setMembros([]);
    setCarregandoMensagens(true);
    try {
      const [lista] = await Promise.all([lerMensagensGrupo(g.id), carregarMembros(g.id)]);
      if (ativaRef.current !== g.id) return;
      setMensagens(lista);
      void carregarAutores(lista);
      setCarregandoMensagens(false);
      marcarLidoGrupo(g.id).then(() => { void carregarLista(); void carregarMembros(g.id); }).catch(() => {});
    } catch {
      if (ativaRef.current === g.id) setErroHistorico(true);
    } finally {
      if (ativaRef.current === g.id) setCarregandoMensagens(false);
    }
  }, [carregarLista, carregarMembros]);

  // Vindo da notificação (/comunidades?g=<id>): abre o grupo.
  const abrirDoLink = useRef(false);
  useEffect(() => {
    if (abrirDoLink.current || carregando) return;
    abrirDoLink.current = true;
    const g = new URLSearchParams(window.location.search).get("g");
    if (g && grupos.some((x) => x.id === g)) void abrir({ id: g });
  }, [carregando, grupos, abrir]);

  // Se saí, fui removido ou o grupo foi excluído, volta para a lista.
  useEffect(() => {
    if (!carregando && ativaId && !grupos.some((g) => g.id === ativaId)) { setAtivaId(null); setInfo(false); }
  }, [grupos, ativaId, carregando]);

  const aoNova = useCallback((m: Mensagem) => {
    if (ativaRef.current === m.grupo_id) {
      setMensagens((atual) => (atual.some((x) => x.id === m.id) ? atual : [...atual, m]));
      void carregarAutores([m]);
      marcarLidoGrupo(m.grupo_id!).catch(() => {});
    }
    void carregarLista();
  }, [carregarLista]);
  const aoMudar = useCallback((m: Mensagem) => {
    setMensagens((atual) => atual.map((x) => (x.id === m.id ? m : x)));
    void carregarLista();
  }, [carregarLista]);
  const aoGrupo = useCallback(() => {
    void carregarLista();
    if (ativaRef.current) void carregarMembros(ativaRef.current);
  }, [carregarLista, carregarMembros]);
  useGruposAoVivo(meuId, aoNova, aoMudar, aoGrupo);

  async function subirEEnviar(tmpId: string, grupoId: string, texto: string, respondeA: string | null, arquivo: File | null, jaSubido?: Anexo) {
    let anexo = jaSubido ?? null;
    if (arquivo && !anexo) {
      const caminho = `${meuId}/${crypto.randomUUID()}-${nomeSeguro(arquivo.name)}`;
      const { error } = await criarClienteNavegador().storage.from("anexos").upload(caminho, arquivo, { contentType: arquivo.type });
      if (error) return null;
      anexo = { caminho, nome: arquivo.name.slice(0, 200), tipo: arquivo.type, tamanho: arquivo.size };
      const guardado = pendentes.current.get(tmpId);
      if (guardado) guardado.anexo = anexo;
    }
    return enviarMensagemGrupoAction(grupoId, texto, respondeA, anexo);
  }

  function concluir(tmpId: string, mensagem: Mensagem) {
    pendentes.current.delete(tmpId);
    if (mensagem.anexo_caminho) pedidas.current.add(mensagem.anexo_caminho);
    setUrls((atual) => {
      const antigo = atual[`tmp/${tmpId}`];
      return antigo && mensagem.anexo_caminho ? { ...atual, [mensagem.anexo_caminho]: antigo } : atual;
    });
    setMensagens((atual) => {
      const real = atual.some((x) => x.id === mensagem.id);
      return real ? atual.filter((x) => x.id !== tmpId) : atual.map((x) => (x.id === tmpId ? mensagem : x));
    });
    void carregarLista();
  }

  async function enviar(texto: string, respondeA: string | null = null, arquivo: File | null = null) {
    if (!ativa || !meuId) return "Escolha uma comunidade.";
    if (arquivo) { const motivo = validarArquivo(arquivo); if (motivo) return motivo; }
    const tmpId = `tmp-${Date.now()}`;
    const provisoria: Local = {
      id: tmpId, remetente_id: meuId, destinatario_id: null, grupo_id: ativa.id, texto,
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
    if (!r || !r.ok) { setMensagens((atual) => atual.map((x) => (x.id === id ? { ...x, falhou: true } : x))); return; }
    concluir(id, r.mensagem);
  }

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
    if (ok) { setMensagens((atual) => atual.map((x) => (x.id === id ? { ...x, texto, editada_em: new Date().toISOString() } : x))); void carregarLista(); }
    return ok;
  }

  async function apagar(id: string) {
    const ok = await apagarMensagemAction(id);
    if (ok) { setMensagens((atual) => atual.map((x) => (x.id === id ? { ...x, texto: "Mensagem apagada", apagada_em: new Date().toISOString(), anexo_caminho: null, anexo_nome: null, anexo_tipo: null, anexo_tamanho: null } : x))); void carregarLista(); }
    return ok;
  }

  const { pessoas, enquetes, votar, encerrar } = useExtras(meuId, mensagens);

  function acrescentar(mensagem: Mensagem) {
    setMensagens((atual) => (atual.some((x) => x.id === mensagem.id) ? atual : [...atual, mensagem]));
    void carregarLista();
  }
  const extras = {
    carregarContatos: async () => (await lerContatos()).map((c) => ({ id: c.id, nome: c.nome, arroba: c.arroba, fotoUrl: c.foto_url })),
    aoEnviarContato: async (pessoaId: string) => {
      if (!ativa) return "Escolha uma comunidade.";
      const r = await enviarContatoAction({ grupoId: ativa.id }, pessoaId);
      if (!r.ok) return r.mensagem;
      acrescentar(r.mensagem);
      return null;
    },
    aoCriarEnquete: async (pergunta: string, opcoes: string[], multipla: boolean) => {
      if (!ativa) return "Escolha uma comunidade.";
      const r = await criarEnqueteAction({ grupoId: ativa.id }, pergunta, opcoes, multipla);
      if (!r.ok) return r.mensagem;
      acrescentar(r.mensagem);
      return null;
    },
    aoVotar: votar,
    aoEncerrar: encerrar,
  };

  const nomeDe = (id: string) => (id === meuId ? "Você" : autores[id]?.nome ?? membros.find((m) => m.id === id)?.nome ?? "Ex-membro");
  // "Lida por todos": todos os outros membros já abriram o grupo depois desta mensagem.
  const outros = membros.filter((m) => m.id !== meuId);
  const lidaPorTodos = (criadoEm: string) => {
    const t = Date.parse(criadoEm);
    if (outros.length === 0 || !outros.every((m) => Date.parse(m.lida_ate) >= t)) return null;
    return outros.reduce((min, m) => (Date.parse(m.lida_ate) < Date.parse(min) ? m.lida_ate : min), outros[0].lida_ate);
  };

  const baloes: BalaoDado[] = mensagens.map((m) => {
    const minha = m.remetente_id === meuId;
    const lida = minha ? lidaPorTodos(m.criado_em) : null;
    const status: StatusEnvio = m.falhou ? "falha" : m.id.startsWith("tmp-") ? "enviando" : lida ? "lida" : "enviada";
    const original = m.responde_a ? mensagens.find((x) => x.id === m.responde_a) : undefined;
    const resposta = m.responde_a
      ? {
          id: m.responde_a,
          autor: original ? nomeDe(original.remetente_id) : "",
          texto: original ? resumoMensagem(original.texto, original.anexo_nome, original.anexo_tipo) || "Mensagem indisponível" : "Mensagem indisponível",
        }
      : null;
    const autor = autores[m.remetente_id];
    return {
      id: m.id, minha, texto: m.sistema ? `${nomeDe(m.remetente_id)} ${m.texto}` : m.texto, criadoEm: m.criado_em, resposta,
      recebidaEm: null, lidaEm: lida, editadaEm: m.editada_em,
      apagada: !!m.apagada_em, status, sistema: !!m.sistema,
      contato: m.contato_ref ? pessoas[m.contato_ref] ?? null : null, ehEnquete: !!m.enquete, enquete: enquetes[m.id] ?? null,
      autor: autor ? { nome: autor.nome, fotoUrl: autor.foto_url } : null,
      anexo: m.anexo_nome && !m.apagada_em
        ? { nome: m.anexo_nome, tipo: m.anexo_tipo ?? "", tamanho: m.anexo_tamanho ?? 0, expirado: anexoExpirado(m.criado_em, m.anexo_caminho), url: m.anexo_caminho ? urls[m.anexo_caminho] ?? null : null }
        : null,
    };
  });

  const resumos: ResumoConversa[] = grupos.map((g) => ({
    id: g.id, nome: g.nome, arroba: "", fotoUrl: g.foto_url,
    ultimaTexto: g.ultima_texto ?? "", ultimaEm: g.ultima_em, naoLidas: g.nao_lidas,
    ultimaMinha: g.ultima_minha, ultimaStatus: "enviada",
  }));
  const pessoaAtiva: Pessoa | null = ativa ? { id: ativa.id, nome: ativa.nome, arroba: "", fotoUrl: ativa.foto_url } : null;

  return (
    <>
      <TelaConversas
        carregandoLista={carregando}
        carregandoMensagens={carregandoMensagens}
        erroLista={erroLista}
        aoTentarLista={() => { setCarregando(true); carregarLista().finally(() => setCarregando(false)); }}
        erroHistorico={erroHistorico}
        aoTentarHistorico={() => { if (ativa) void abrir(ativa); }}
        aoReenviar={reenviar}
        conversas={resumos}
        novos={[]}
        ativa={pessoaAtiva}
        mensagens={baloes}
        aoAbrir={(p) => void abrir(p)}
        aoVoltar={() => { setAtivaId(null); void carregarLista(); }}
        aoEnviar={enviar}
        digitando={false}
        aoDigitar={() => {}}
        aoEditar={editar}
        aoApagar={apagar}
        aoBaixar={baixar}
        extras={extras}
        grupo={{
          titulo: "Comunidades",
          vazio: "Você ainda não está em nenhuma comunidade.",
          subtitulo: ativa ? `${ativa.membros} membro${ativa.membros === 1 ? "" : "s"}${ativa.so_admins ? " · só admins escrevem" : ""}` : "",
          aoAbrirInfo: () => setInfo(true),
          bloqueado: !!ativa && !ativa.posso_escrever,
        }}
      />
      {info && ativa && meuId && (
        <InfoGrupo
          grupo={ativa}
          membros={membros}
          meuId={meuId}
          souAdmin={souAdmin}
          aoFechar={() => setInfo(false)}
          aoMudar={() => { void carregarLista(); void carregarMembros(ativa.id); }}
          aoSair={() => { setInfo(false); setAtivaId(null); void carregarLista(); }}
        />
      )}
    </>
  );
}
