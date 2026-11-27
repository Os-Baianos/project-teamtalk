"use server";

import { after } from "next/server";
import { criarClienteServidor } from "../supabase/servidor";
import { enviarPushDaMensagem, enviarPushDoGrupo } from "../push/enviar";
import type { Mensagem } from "./acoes";

type Destino = { contatoId: string } | { grupoId: string };
type Retorno = { ok: true; mensagem: Mensagem } | { ok: false; mensagem: string };

async function gravar(destino: Destino, campos: Record<string, unknown>, textoPush: string): Promise<Retorno> {
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getClaims();
  const meuId = auth?.claims.sub;
  if (!meuId) return { ok: false, mensagem: "Entre para enviar mensagens." };
  const alvo = "grupoId" in destino ? { grupo_id: destino.grupoId } : { destinatario_id: destino.contatoId };
  const { data, error } = await supabase.from("mensagens").insert({ remetente_id: meuId, ...alvo, ...campos }).select().single();
  if (error || !data) return { ok: false, mensagem: "Não foi possível enviar agora." };
  after(() => ("grupoId" in destino ? enviarPushDoGrupo(supabase, meuId, destino.grupoId, textoPush) : enviarPushDaMensagem(supabase, meuId, destino.contatoId, textoPush)));
  return { ok: true, mensagem: data };
}

export async function enviarContatoAction(destino: Destino, pessoaId: string): Promise<Retorno> {
  const supabase = await criarClienteServidor();
  const { data: p } = await supabase.from("perfis").select("nome").eq("id", pessoaId).maybeSingle();
  if (!p) return { ok: false, mensagem: "Pessoa não encontrada." };
  const texto = `Contato: ${p.nome}`;
  return gravar(destino, { texto, contato_ref: pessoaId }, texto);
}

export async function criarEnqueteAction(destino: Destino, pergunta: string, opcoes: string[], multipla: boolean): Promise<Retorno> {
  const q = pergunta.trim();
  const ops = opcoes.map((o) => o.trim()).filter(Boolean);
  if (!q) return { ok: false, mensagem: "Escreva a pergunta." };
  if (q.length > 300) return { ok: false, mensagem: "A pergunta pode ter até 300 caracteres." };
  if (ops.length < 2 || ops.length > 6) return { ok: false, mensagem: "Use de 2 a 6 opções." };
  if (new Set(ops.map((o) => o.toLowerCase())).size !== ops.length) return { ok: false, mensagem: "Há opções repetidas." };
  if (ops.some((o) => o.length > 100)) return { ok: false, mensagem: "Cada opção pode ter até 100 caracteres." };
  const r = await gravar(destino, { texto: q, enquete: true }, `Enquete: ${q}`);
  if (!r.ok) return r;
  const supabase = await criarClienteServidor();
  const { data } = await supabase.rpc("enquete_definir", { msg: r.mensagem.id, opcoes: ops, multipla });
  if (data !== true) {
    await supabase.rpc("apagar_mensagem", { msg: r.mensagem.id });
    return { ok: false, mensagem: "Não foi possível criar a enquete." };
  }
  return r;
}

export async function encerrarEnqueteAction(msg: string): Promise<boolean> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.rpc("enquete_encerrar", { msg });
  return data === true;
}
