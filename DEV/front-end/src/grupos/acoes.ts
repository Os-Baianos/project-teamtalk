"use server";

import { after } from "next/server";
import { criarClienteServidor } from "../supabase/servidor";
import { enviarPushDoGrupo } from "../push/enviar";
import { ehImagem, ehVideo, LIMITE_ANEXO, TIPOS_ANEXO } from "../mensagens/anexos";
import type { Anexo } from "../mensagens/anexos";
import type { Mensagem } from "../mensagens/acoes";

type Resultado = { ok: boolean; mensagem?: string };

export async function enviarMensagemGrupoAction(
  grupoId: string,
  texto: string,
  respondeA: string | null = null,
  anexo: Anexo | null = null,
): Promise<{ ok: true; mensagem: Mensagem } | { ok: false; mensagem: string }> {
  const limpo = texto.trim();
  if (!limpo && !anexo) return { ok: false, mensagem: "Digite uma mensagem." };
  if (limpo.length > 2000) return { ok: false, mensagem: "Mensagem muito longa (máximo 2000 caracteres)." };
  if (anexo && (anexo.tamanho <= 0 || anexo.tamanho > LIMITE_ANEXO || !TIPOS_ANEXO.includes(anexo.tipo))) return { ok: false, mensagem: "Arquivo não aceito." };
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getClaims();
  const meuId = auth?.claims.sub;
  if (!meuId) return { ok: false, mensagem: "Entre para enviar mensagens." };
  const { data, error } = await supabase.from("mensagens").insert({
    remetente_id: meuId, grupo_id: grupoId, texto: limpo, responde_a: respondeA,
    ...(anexo ? { anexo_caminho: anexo.caminho, anexo_nome: anexo.nome.slice(0, 200), anexo_tipo: anexo.tipo, anexo_tamanho: anexo.tamanho } : {}),
  }).select().single();
  if (error || !data) return { ok: false, mensagem: "Não foi possível enviar. Só os admins escrevem quando o chat está fechado." };
  const resumo = limpo || (anexo ? (ehImagem(anexo.tipo) ? "Enviou uma foto" : ehVideo(anexo.tipo) ? "Enviou um vídeo" : `Enviou um arquivo: ${anexo.nome}`) : "");
  after(() => enviarPushDoGrupo(supabase, meuId, grupoId, resumo));
  return { ok: true, mensagem: data };
}

async function chamar(nome: string, args: Record<string, unknown>, erro: string): Promise<Resultado> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc(nome, args);
  if (error || data === false) return { ok: false, mensagem: erro };
  return { ok: true };
}

/** Só Admin/DEV (o banco confere). */
export async function criarGrupoAction(nome: string, membros: string[], fechado: boolean): Promise<Resultado & { id?: string }> {
  const limpo = nome.trim();
  if (!limpo) return { ok: false, mensagem: "Dê um nome ao grupo." };
  if (limpo.length > 60) return { ok: false, mensagem: "O nome pode ter até 60 caracteres." };
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("grupo_criar", { nome: limpo, membros, so_admins: fechado });
  if (error || !data) return { ok: false, mensagem: "Não foi possível criar o grupo agora." };
  return { ok: true, id: data as string };
}

export async function configurarGrupoAction(grupoId: string, nome: string, fechado: boolean): Promise<Resultado> {
  const limpo = nome.trim();
  if (!limpo || limpo.length > 60) return { ok: false, mensagem: "O nome precisa ter de 1 a 60 caracteres." };
  return chamar("grupo_configurar", { g: grupoId, novo_nome: limpo, fechado }, "Não foi possível salvar.");
}
export async function adicionarMembrosAction(grupoId: string, usuarios: string[]): Promise<Resultado> {
  return chamar("grupo_adicionar", { g: grupoId, usuarios }, "Não foi possível adicionar.");
}
export async function removerMembroAction(grupoId: string, usuario: string): Promise<Resultado> {
  return chamar("grupo_remover", { g: grupoId, usuario }, "Não foi possível remover.");
}
export async function excluirGrupoAction(grupoId: string): Promise<Resultado> {
  return chamar("grupo_excluir", { g: grupoId }, "Não foi possível excluir o grupo.");
}
export async function sairDoGrupoAction(grupoId: string): Promise<Resultado> {
  return chamar("grupo_sair", { g: grupoId }, "Não foi possível sair do grupo.");
}
