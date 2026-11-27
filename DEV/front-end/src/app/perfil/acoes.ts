"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "../../supabase/servidor";
import { regrasNome, todasOk } from "../../design/validacoes";

/** Troca o nome da pessoa logada. O banco confere de novo e só altera o próprio perfil. */
export async function editarNomeAction(nome: string): Promise<{ ok: boolean; mensagem?: string }> {
  if (!todasOk(regrasNome(nome))) return { ok: false, mensagem: "Digite nome e sobrenome." };
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("definir_nome", { novo: nome });
  if (error) return { ok: false, mensagem: "Não foi possível salvar agora. Tente novamente." };
  if (data !== "ok") return { ok: false, mensagem: "Nome inválido." };
  revalidatePath("/perfil");
  return { ok: true };
}

/** Troca o @ da pessoa logada. O banco confere o formato, se já está em uso e a espera de 30 dias. */
export async function editarArrobaAction(arroba: string): Promise<{ ok: boolean; mensagem?: string }> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("definir_arroba", { novo: arroba });
  if (error) return { ok: false, mensagem: "Não foi possível salvar agora. Tente novamente." };
  if (data === "ok") { revalidatePath("/perfil"); return { ok: true }; }
  if (data === "igual") return { ok: false, mensagem: "Esse já é o seu @." };
  if (data === "em_uso") return { ok: false, mensagem: "Este @ já está em uso." };
  if (data === "aguarde") return { ok: false, mensagem: "Você trocou o @ há pouco tempo. Aguarde os 30 dias ou peça a um admin." };
  return { ok: false, mensagem: "O @ deve ter de 3 a 20 caracteres: letras minúsculas, números, ponto ou _, começando com letra." };
}
