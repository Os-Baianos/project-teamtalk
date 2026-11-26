"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "../supabase/servidor";
import { regrasSenha, todasOk } from "../design/validacoes";

export type UsuarioDev = { id: string; nome: string; arroba: string; email: string; papel: string; criado_em: string };

/** A pessoa logada tem conta dev? (A permissão real é conferida de novo no banco em cada ação.) */
export async function souDevAction(): Promise<boolean> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.rpc("sou_dev");
  return data === true;
}

export async function listarUsuariosAction(): Promise<UsuarioDev[]> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.rpc("dev_listar_usuarios");
  return data ?? [];
}

export async function excluirUsuarioAction(id: string): Promise<{ ok: boolean; mensagem?: string }> {
  const supabase = await criarClienteServidor();
  // Primeiro confirma que é dev e que não é a própria conta; só então apaga as fotos e a conta.
  const { data: dev } = await supabase.rpc("sou_dev");
  const { data: eu } = await supabase.auth.getUser();
  if (dev === true && eu.user?.id !== id) {
    const { data: arquivos } = await supabase.storage.from("avatares").list(id);
    if (arquivos?.length) await supabase.storage.from("avatares").remove(arquivos.map((a) => `${id}/${a.name}`));
  }
  const { data, error } = await supabase.rpc("dev_excluir_usuario", { alvo: id });
  if (error) return { ok: false, mensagem: "Não foi possível excluir agora. Tente novamente." };
  if (data === "ok") { revalidatePath("/dev"); return { ok: true }; }
  if (data === "proprio") return { ok: false, mensagem: "Você não pode excluir a própria conta por aqui." };
  if (data === "inexistente") return { ok: false, mensagem: "Esse usuário já não existe." };
  return { ok: false, mensagem: "Sem permissão para excluir." };
}

export async function editarUsuarioAction(
  id: string, nome: string, arroba: string,
): Promise<{ ok: boolean; mensagem?: string }> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("dev_editar_usuario", { alvo: id, novo_nome: nome, novo_arroba: arroba });
  if (error) return { ok: false, mensagem: "Não foi possível salvar agora. Tente novamente." };
  if (data === "ok") { revalidatePath("/dev"); return { ok: true }; }
  if (data === "nome_invalido") return { ok: false, mensagem: "Informe um nome com pelo menos 3 letras." };
  if (data === "arroba_invalido") return { ok: false, mensagem: "O @ deve ter de 3 a 30 caracteres: letras minúsculas, números, ponto ou _." };
  if (data === "arroba_em_uso") return { ok: false, mensagem: "Este @ já está em uso." };
  if (data === "inexistente") return { ok: false, mensagem: "Esse usuário já não existe." };
  return { ok: false, mensagem: "Sem permissão para editar." };
}

export async function trocarSenhaAction(id: string, senha: string): Promise<{ ok: boolean; mensagem?: string }> {
  if (!todasOk(regrasSenha(senha))) {
    const faltou = regrasSenha(senha).find((r) => !r.ok);
    return { ok: false, mensagem: `Senha fraca: ${faltou?.texto.toLowerCase() ?? "confira as regras"}.` };
  }
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("dev_trocar_senha", { alvo: id, nova: senha });
  if (error) return { ok: false, mensagem: "Não foi possível trocar a senha agora. Tente novamente." };
  if (data === "ok") return { ok: true };
  if (data === "senha_fraca") return { ok: false, mensagem: "Senha fraca. Use maiúscula, minúscula, número e símbolo." };
  if (data === "inexistente") return { ok: false, mensagem: "Esse usuário já não existe." };
  return { ok: false, mensagem: "Sem permissão para trocar a senha." };
}
