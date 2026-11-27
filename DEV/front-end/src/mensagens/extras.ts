"use client";

import { criarClienteNavegador } from "../supabase/navegador";

/** Contato e enquete dentro das mensagens (leituras no navegador; a segurança fica no banco). */

export type PessoaCartao = { id: string; nome: string; arroba: string; fotoUrl: string | null };
export type OpcaoEnquete = { id: string; texto: string; votos: number; meuVoto: boolean };
export type DadosEnquete = { multipla: boolean; encerrada: boolean; total: number; opcoes: OpcaoEnquete[] };

const banco = () => criarClienteNavegador();

export async function lerPessoas(ids: string[]): Promise<Record<string, PessoaCartao>> {
  if (ids.length === 0) return {};
  const { data } = await banco().from("perfis").select("id, nome, arroba, foto_path").in("id", ids);
  return Object.fromEntries((data ?? []).map((p) => [p.id as string, {
    id: p.id as string, nome: p.nome as string, arroba: p.arroba as string,
    fotoUrl: p.foto_path ? banco().storage.from("avatares").getPublicUrl(p.foto_path as string).data.publicUrl : null,
  }]));
}

export async function lerEnquetes(msgs: string[], meuId: string): Promise<Record<string, DadosEnquete>> {
  if (msgs.length === 0) return {};
  const supabase = banco();
  const [enq, ops, votos] = await Promise.all([
    supabase.from("enquetes").select("mensagem_id, multipla, encerrada_em").in("mensagem_id", msgs),
    supabase.from("enquete_opcoes").select("id, mensagem_id, texto, pos").in("mensagem_id", msgs).order("pos"),
    supabase.from("enquete_votos").select("opcao_id, usuario_id").in("mensagem_id", msgs),
  ]);
  const saida: Record<string, DadosEnquete> = {};
  for (const e of enq.data ?? []) saida[e.mensagem_id as string] = { multipla: !!e.multipla, encerrada: !!e.encerrada_em, total: 0, opcoes: [] };
  const pessoasPorMsg = new Map<string, Set<string>>();
  const msgDaOpcao = new Map<string, string>();
  for (const o of ops.data ?? []) {
    msgDaOpcao.set(o.id as string, o.mensagem_id as string);
    saida[o.mensagem_id as string]?.opcoes.push({ id: o.id as string, texto: o.texto as string, votos: 0, meuVoto: false });
  }
  for (const v of votos.data ?? []) {
    const m = msgDaOpcao.get(v.opcao_id as string);
    const op = m ? saida[m]?.opcoes.find((x) => x.id === v.opcao_id) : undefined;
    if (!m || !op) continue;
    op.votos++;
    if (v.usuario_id === meuId) op.meuVoto = true;
    if (!pessoasPorMsg.has(m)) pessoasPorMsg.set(m, new Set());
    pessoasPorMsg.get(m)!.add(v.usuario_id as string);
  }
  for (const [m, quem] of pessoasPorMsg) saida[m].total = quem.size;
  return saida;
}

export async function votarEnquete(msg: string, opcao: string, marcar: boolean): Promise<boolean> {
  const { data } = await banco().rpc("enquete_votar", { msg, opcao, marcar });
  return data === true;
}
