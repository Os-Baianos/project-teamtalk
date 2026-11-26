"use server";

import { criarClienteServidor } from "../supabase/servidor";

export type ContatoDado = { id: string; nome: string; arroba: string };

/** Procura um usuário pelo @ (nunca devolve a própria pessoa). */
export async function buscarPerfilAction(arroba: string): Promise<ContatoDado | null> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.rpc("buscar_perfil", { candidato: arroba });
  return data?.[0] ?? null;
}

export async function listarContatosAction(): Promise<ContatoDado[]> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.rpc("listar_contatos");
  return data ?? [];
}

export async function adicionarContatoAction(arroba: string): Promise<{ ok: boolean; mensagem?: string }> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("adicionar_contato", { candidato: arroba });
  if (error) return { ok: false, mensagem: "Não foi possível adicionar agora. Tente novamente." };
  if (data === "ok") return { ok: true };
  if (data === "duplicado") return { ok: false, mensagem: "Este contato já está na sua lista." };
  if (data === "proprio") return { ok: false, mensagem: "Você não pode adicionar a si mesmo." };
  return { ok: false, mensagem: "Nenhum usuário encontrado com esse @." };
}

export async function removerContatoAction(id: string): Promise<{ ok: boolean }> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("contatos").delete().eq("contato_id", id);
  return { ok: !error };
}
