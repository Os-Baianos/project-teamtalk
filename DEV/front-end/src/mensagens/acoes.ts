"use server";

import { after } from "next/server";
import { criarClienteServidor } from "../supabase/servidor";
import { enviarPushDaMensagem } from "../push/enviar";
import { ehImagem, ehVideo, LIMITE_ANEXO, TIPOS_ANEXO } from "./anexos";
import type { Anexo } from "./anexos";

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
  anexo_caminho?: string | null;
  anexo_nome?: string | null;
  anexo_tipo?: string | null;
  anexo_tamanho?: number | null;
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
  anexo: Anexo | null = null,
): Promise<{ ok: true; mensagem: Mensagem } | { ok: false; mensagem: string }> {
  const limpo = texto.trim();
  if (!limpo && !anexo) return { ok: false, mensagem: "Digite uma mensagem." };
  if (anexo && (anexo.tamanho <= 0 || anexo.tamanho > LIMITE_ANEXO || !TIPOS_ANEXO.includes(anexo.tipo))) return { ok: false, mensagem: "Arquivo não aceito." };
  if (limpo.length > 2000) return { ok: false, mensagem: "Mensagem muito longa (máximo 2000 caracteres)." };
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getClaims();
  const meuId = auth?.claims.sub;
  if (!meuId) return { ok: false, mensagem: "Entre para enviar mensagens." };
  const { data, error } = await supabase
    .from("mensagens")
    .insert({
      remetente_id: meuId, destinatario_id: contatoId, texto: limpo, responde_a: respondeA,
      ...(anexo ? { anexo_caminho: anexo.caminho, anexo_nome: anexo.nome.slice(0, 200), anexo_tipo: anexo.tipo, anexo_tamanho: anexo.tamanho } : {}),
    })
    .select()
    .single();
  if (error || !data) return { ok: false, mensagem: "Não foi possível enviar agora. Tente novamente." };
  // Notificação no celular de quem recebe, sem atrasar a resposta de quem enviou.
  after(() => enviarPushDaMensagem(supabase, meuId, contatoId, anexo && !limpo ? (ehImagem(anexo.tipo) ? "Enviou uma foto" : ehVideo(anexo.tipo) ? "Enviou um vídeo" : `Enviou um arquivo: ${anexo.nome}`) : limpo));
  return { ok: true, mensagem: data };
}

export async function editarMensagemAction(id: string, texto: string): Promise<boolean> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.rpc("editar_mensagem", { msg: id, novo: texto });
  return data === true;
}

export async function apagarMensagemAction(id: string): Promise<boolean> {
  const supabase = await criarClienteServidor();
  const { data: antes } = await supabase.from("mensagens").select("anexo_caminho").eq("id", id).maybeSingle();
  const { data } = await supabase.rpc("apagar_mensagem", { msg: id });
  // O arquivo também sai do armazenamento (o acesso a ele já foi cortado pelo banco).
  if (data === true && antes?.anexo_caminho) await supabase.storage.from("anexos").remove([antes.anexo_caminho]);
  return data === true;
}

/** Exclui a conversa só do meu lado; a outra pessoa continua vendo. */
export async function excluirConversaAction(contatoId: string): Promise<boolean> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("limpar_conversa", { outro: contatoId });
  return !error;
}
