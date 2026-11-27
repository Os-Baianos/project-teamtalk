"use server";

import { after } from "next/server";
import { criarClienteServidor } from "../supabase/servidor";
import { enviarPushDaMensagem } from "../push/enviar";

export type Mensagem = {
  id: string;
  remetente_id: string;
  destinatario_id: string;
  texto: string;
  criado_em: string;
  lida_em: string | null;
  recebida_em: string | null;
  editada_em: string | null;
  apagada_em: string | null;
  /** Id da mensagem a que esta responde (ou null). */
  responde_a?: string | null;
};

export type Conversa = {
  contato_id: string;
  nome: string;
  arroba: string;
  ultima_texto: string;
  ultima_em: string;
  nao_lidas: number;
  ultima_minha: boolean;
  ultima_status: "enviada" | "recebida" | "lida";
  foto_url: string | null;
};

export async function enviarMensagemAction(
  contatoId: string,
  texto: string,
  respondeA: string | null = null,
): Promise<{ ok: true; mensagem: Mensagem } | { ok: false; mensagem: string }> {
  const limpo = texto.trim();
  if (!limpo) return { ok: false, mensagem: "Digite uma mensagem." };
  if (limpo.length > 2000) return { ok: false, mensagem: "Mensagem muito longa (máximo 2000 caracteres)." };
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getClaims();
  const meuId = auth?.claims.sub;
  if (!meuId) return { ok: false, mensagem: "Entre para enviar mensagens." };
  const { data, error } = await supabase
    .from("mensagens")
    .insert({ remetente_id: meuId, destinatario_id: contatoId, texto: limpo, responde_a: respondeA })
    .select()
    .single();
  if (error || !data) return { ok: false, mensagem: "Não foi possível enviar agora. Tente novamente." };
  // Notificação no celular de quem recebe, sem atrasar a resposta de quem enviou.
  after(() => enviarPushDaMensagem(supabase, meuId, contatoId, limpo));
  return { ok: true, mensagem: data };
}

export async function editarMensagemAction(id: string, texto: string): Promise<boolean> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.rpc("editar_mensagem", { msg: id, novo: texto });
  return data === true;
}

export async function apagarMensagemAction(id: string): Promise<boolean> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.rpc("apagar_mensagem", { msg: id });
  return data === true;
}

/** Exclui a conversa só do meu lado; a outra pessoa continua vendo. */
export async function excluirConversaAction(contatoId: string): Promise<boolean> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("limpar_conversa", { outro: contatoId });
  return !error;
}
