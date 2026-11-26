"use client";

import { criarClienteNavegador } from "../supabase/navegador";
import { gravarCache } from "../cache/cache-local";
import type { Conversa, Mensagem } from "../mensagens/acoes";
import type { ContatoDado, Relacao, Solicitacoes } from "../contatos/acoes";

/**
 * Leituras (conversas, contatos, mensagens, solicitações) direto do navegador para o Supabase.
 * Assim o pedido faz um salto só (navegador → Supabase), sem passar pelo servidor do Vercel.
 * A segurança continua no banco: cada função confere quem está logado (auth.uid()).
 */

type Linha = { id: string; nome: string; arroba: string; foto_path: string | null; relacao?: Relacao; direcao?: "recebida" | "enviada" };

function banco() { return criarClienteNavegador(); }

async function chamar<T>(nome: string, args?: Record<string, string>): Promise<T> {
  const { data, error } = await banco().rpc(nome, args);
  if (error) throw new Error(error.message);
  return data as T;
}

function comFoto(l: Linha): ContatoDado {
  const foto_url = l.foto_path ? banco().storage.from("avatares").getPublicUrl(l.foto_path).data.publicUrl : null;
  return { id: l.id, nome: l.nome, arroba: l.arroba, foto_url, relacao: l.relacao };
}

export async function lerContatos(): Promise<ContatoDado[]> {
  return (await chamar<Linha[]>("listar_contatos") ?? []).map(comFoto);
}

export async function lerConversas(): Promise<Conversa[]> {
  type Bruta = Omit<Conversa, "foto_url"> & { foto_path: string | null };
  return ((await chamar<Bruta[]>("listar_conversas")) ?? []).map(({ foto_path, ...c }) => ({
    ...c,
    nao_lidas: Number(c.nao_lidas),
    foto_url: foto_path ? banco().storage.from("avatares").getPublicUrl(foto_path).data.publicUrl : null,
  }));
}

export async function lerSolicitacoes(): Promise<Solicitacoes> {
  const linhas = (await chamar<Linha[]>("listar_solicitacoes")) ?? [];
  return {
    recebidas: linhas.filter((l) => l.direcao === "recebida").map(comFoto),
    enviadas: linhas.filter((l) => l.direcao === "enviada").map(comFoto),
  };
}

export async function lerMensagens(contatoId: string): Promise<Mensagem[]> {
  return ((await chamar<Mensagem[]>("listar_mensagens", { outro: contatoId })) ?? []);
}

export async function marcarLidas(contatoId: string): Promise<void> {
  await chamar("marcar_lidas", { de: contatoId });
}

export async function marcarRecebidas(): Promise<void> {
  await chamar("marcar_recebidas");
}

/** Tudo o que a tela de Conversas precisa para abrir (e já marca o que chegou como recebido), em paralelo. */
export async function lerInicio(): Promise<{ conversas: Conversa[]; contatos: ContatoDado[] }> {
  const [conversas, contatos] = await Promise.all([lerConversas(), lerContatos(), marcarRecebidas()]);
  return { conversas, contatos };
}

/** Solicitações e contatos juntos (tela Meus contatos e número no menu). */
export async function lerContaContatos(): Promise<{ solicitacoes: Solicitacoes; contatos: ContatoDado[] }> {
  const [solicitacoes, contatos] = await Promise.all([lerSolicitacoes(), lerContatos()]);
  return { solicitacoes, contatos };
}

/** Deixa guardadas as mensagens das conversas mais recentes: ao abrir uma, ela aparece na hora. */
export async function aquecerMensagens(contatoIds: string[]): Promise<void> {
  await Promise.all(contatoIds.slice(0, 6).map(async (id) => {
    try { gravarCache(`msgs:${id}`, await lerMensagens(id)); } catch { /* sem cache para essa conversa */ }
  }));
}
