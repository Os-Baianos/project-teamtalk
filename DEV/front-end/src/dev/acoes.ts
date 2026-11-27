"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "../supabase/servidor";
import { regrasSenha, todasOk } from "../design/validacoes";

export type UsuarioDev = { id: string; nome: string; arroba: string; email: string; papel: string; criado_em: string; foto_url: string | null; arroba_alterado_em: string | null };

/** A pessoa logada tem conta dev? (A permissão real é conferida de novo no banco em cada ação.) */
export async function souDevAction(): Promise<boolean> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.rpc("sou_dev");
  return data === true;
}

export async function listarUsuariosAction(): Promise<UsuarioDev[]> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.rpc("dev_listar_usuarios");
  return (data ?? []).map((u: Omit<UsuarioDev, "foto_url"> & { foto_path: string | null }) => {
    const { foto_path, ...resto } = u;
    const foto_url = foto_path ? supabase.storage.from("avatares").getPublicUrl(foto_path).data.publicUrl : null;
    return { ...resto, foto_url };
  });
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
  if (data === "senha_fraca") return { ok: false, mensagem: "Senha inválida. Use de 4 a 72 caracteres." };
  if (data === "inexistente") return { ok: false, mensagem: "Esse usuário já não existe." };
  return { ok: false, mensagem: "Sem permissão para trocar a senha." };
}

/** Admin: zera a contagem dos 30 dias para a pessoa poder trocar o @ de novo. */
export async function liberarTrocaArrobaAction(id: string): Promise<{ ok: boolean; mensagem?: string }> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("dev_liberar_troca_arroba", { alvo: id });
  if (error) return { ok: false, mensagem: "Não foi possível liberar agora. Tente novamente." };
  if (data === "ok") { revalidatePath("/dev"); return { ok: true }; }
  if (data === "inexistente") return { ok: false, mensagem: "Esse usuário já não existe." };
  return { ok: false, mensagem: "Sem permissão." };
}
