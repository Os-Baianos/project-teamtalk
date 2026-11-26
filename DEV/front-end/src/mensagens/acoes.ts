"use server";

import { criarClienteServidor } from "../supabase/servidor";

export type Mensagem = {
  id: string;
  remetente_id: string;
  destinatario_id: string;
  texto: string;
  criado_em: string;
  lida_em: string | null;
};

export type Conversa = {
  contato_id: string;
  nome: string;
  arroba: string;
  ultima_texto: string;
  ultima_em: string;
  nao_lidas: number;
};

/** Quem está logado (id), para saber quais bolhas são minhas. */
export async function meuIdAction(): Promise<string | null> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function listarConversasAction(): Promise<Conversa[]> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.rpc("listar_conversas");
  return (data ?? []).map((c: Conversa) => ({ ...c, nao_lidas: Number(c.nao_lidas) }));
}

/** Histórico com uma pessoa, do mais antigo para o mais novo. */
export async function listarMensagensAction(contatoId: string): Promise<Mensagem[]> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("mensagens")
    .select("*")
    .or(`remetente_id.eq.${contatoId},destinatario_id.eq.${contatoId}`)
    .order("criado_em", { ascending: true })
    .limit(500);
  return data ?? [];
}

export async function enviarMensagemAction(
  contatoId: string,
  texto: string,
): Promise<{ ok: true; mensagem: Mensagem } | { ok: false; mensagem: string }> {
  const limpo = texto.trim();
  if (!limpo) return { ok: false, mensagem: "Digite uma mensagem." };
  if (limpo.length > 2000) return { ok: false, mensagem: "Mensagem muito longa (máximo 2000 caracteres)." };
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, mensagem: "Entre para enviar mensagens." };
  const { data, error } = await supabase
    .from("mensagens")
    .insert({ remetente_id: auth.user.id, destinatario_id: contatoId, texto: limpo })
    .select()
    .single();
  if (error || !data) return { ok: false, mensagem: "Não foi possível enviar agora. Tente novamente." };
  return { ok: true, mensagem: data };
}

export async function marcarLidasAction(contatoId: string): Promise<void> {
  const supabase = await criarClienteServidor();
  await supabase.rpc("marcar_lidas", { de: contatoId });
}
