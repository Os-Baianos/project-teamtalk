"use server";

import { criarClienteServidor } from "../supabase/servidor";
import { regrasSenha, todasOk } from "../design/validacoes";

type Resultado = { ok: boolean; mensagem?: string };

/** Confere a senha atual entrando de novo com ela; devolve o id da pessoa ou a mensagem de erro. */
async function conferirSenha(supabase: Awaited<ReturnType<typeof criarClienteServidor>>, senha: string) {
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!data.user || !email) return { erro: "Entre novamente para continuar." } as const;
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { erro: "Senha atual incorreta." } as const;
  return { id: data.user.id } as const;
}

/** Troca a senha de quem está logado, pedindo a senha atual. */
export async function trocarMinhaSenhaAction(atual: string, nova: string): Promise<Resultado> {
  if (!todasOk(regrasSenha(nova))) {
    const faltou = regrasSenha(nova).find((r) => !r.ok);
    return { ok: false, mensagem: `Senha fraca: ${faltou?.texto.toLowerCase() ?? "confira as regras"}.` };
  }
  if (atual === nova) return { ok: false, mensagem: "A nova senha precisa ser diferente da atual." };
  const supabase = await criarClienteServidor();
  const conferida = await conferirSenha(supabase, atual);
  if ("erro" in conferida) return { ok: false, mensagem: conferida.erro };
  const { data, error } = await supabase.rpc("trocar_minha_senha", { nova });
  if (error || data !== "ok") return { ok: false, mensagem: "Não foi possível trocar a senha agora. Tente novamente." };
  return { ok: true };
}

/** Exclui a própria conta (pede a senha). Contas Admin não saem por aqui, para o app não ficar sem admin. */
export async function excluirMinhaContaAction(senha: string): Promise<Resultado> {
  const supabase = await criarClienteServidor();
  const conferida = await conferirSenha(supabase, senha);
  if ("erro" in conferida) return { ok: false, mensagem: conferida.erro };
  const { data: dev } = await supabase.rpc("sou_dev");
  if (dev === true) return { ok: false, mensagem: "Contas Admin não podem ser excluídas por aqui." };
  const { data: arquivos } = await supabase.storage.from("avatares").list(conferida.id);
  if (arquivos?.length) await supabase.storage.from("avatares").remove(arquivos.map((a) => `${conferida.id}/${a.name}`));
  const { data: anexos } = await supabase.storage.from("anexos").list(conferida.id);
  if (anexos?.length) await supabase.storage.from("anexos").remove(anexos.map((a) => `${conferida.id}/${a.name}`));
  const { data, error } = await supabase.rpc("excluir_minha_conta");
  if (error || data !== "ok") return { ok: false, mensagem: "Não foi possível excluir agora. Tente novamente." };
  try { await supabase.auth.signOut({ scope: "local" }); } catch { /* a conta já não existe */ }
  return { ok: true };
}
