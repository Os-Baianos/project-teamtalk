"use server";

import { criarClienteServidor } from "../supabase/servidor";

/** Relação entre a pessoa logada e outra: nenhuma | contato | enviada (eu pedi) | recebida (ela pediu). */
export type Relacao = "nenhuma" | "contato" | "enviada" | "recebida";

export type ContatoDado = { id: string; nome: string; arroba: string; foto_url?: string | null; relacao?: Relacao };

type Linha = { id: string; nome: string; arroba: string; foto_path: string | null; relacao?: Relacao };

/** Troca o caminho da foto (foto_path) pelo endereço público da imagem. */
function comFoto(supabase: Awaited<ReturnType<typeof criarClienteServidor>>, l: Linha): ContatoDado {
  const foto_url = l.foto_path ? supabase.storage.from("avatares").getPublicUrl(l.foto_path).data.publicUrl : null;
  return { id: l.id, nome: l.nome, arroba: l.arroba, foto_url, relacao: l.relacao };
}

/** Procura um usuário pelo @ (nunca devolve a própria pessoa). */
export async function buscarPerfilAction(arroba: string): Promise<ContatoDado | null> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.rpc("buscar_perfil", { candidato: arroba });
  return data?.[0] ? comFoto(supabase, data[0]) : null;
}

/** Até 5 sugestões enquanto a pessoa digita o @. */
export async function sugerirPerfisAction(termo: string): Promise<ContatoDado[]> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.rpc("sugerir_perfis", { termo });
  return ((data ?? []) as Linha[]).map((l) => comFoto(supabase, l));
}

export type Solicitacoes = { recebidas: ContatoDado[]; enviadas: ContatoDado[] };

/** Resultado de uma ação de contato: `relacao` é como ficou a relação depois dela. */
export type ResultadoContato = { ok: boolean; mensagem?: string; relacao?: Relacao };

const ERRO_GERAL = "Não foi possível agora. Tente novamente.";

/** Envia a solicitação (ou aceita na hora, se a outra pessoa já tinha pedido). */
export async function solicitarContatoAction(arroba: string): Promise<ResultadoContato> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("solicitar_contato", { candidato: arroba });
  if (error) return { ok: false, mensagem: ERRO_GERAL };
  if (data === "ok" || data === "ja_enviada") return { ok: true, relacao: "enviada" };
  if (data === "aceita" || data === "ja_contato") return { ok: true, relacao: "contato" };
  if (data === "proprio") return { ok: false, mensagem: "Você não pode adicionar a si mesmo." };
  return { ok: false, mensagem: "Nenhum usuário encontrado com esse @." };
}

async function acao(nome: string, args: Record<string, string>, depois: Relacao): Promise<ResultadoContato> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc(nome, args);
  if (error) return { ok: false, mensagem: ERRO_GERAL };
  // "inexistente": a situação já mudou do outro lado (ex.: pedido cancelado); a tela recarrega.
  if (data !== "ok" && data !== "inexistente") return { ok: false, mensagem: ERRO_GERAL };
  return { ok: true, relacao: depois };
}

export async function aceitarSolicitacaoAction(id: string) { return acao("aceitar_solicitacao", { de: id }, "contato"); }
export async function recusarSolicitacaoAction(id: string) { return acao("recusar_solicitacao", { de: id }, "nenhuma"); }
export async function cancelarSolicitacaoAction(id: string) { return acao("cancelar_solicitacao", { para: id }, "nenhuma"); }
export async function removerContatoAction(id: string) { return acao("remover_contato", { contato: id }, "nenhuma"); }

