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
