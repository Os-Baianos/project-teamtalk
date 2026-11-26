"use server";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "../supabase/servidor";

export type Resultado = { ok: true } | { ok: false; mensagem: string };

function traduzirErro(codigo: string | undefined, texto: string): string {
  const t = texto.toLowerCase();
  if (codigo === "invalid_credentials" || t.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (codigo === "email_not_confirmed") return "Confirme seu e-mail para entrar.";
  if (codigo === "user_already_exists" || t.includes("already registered")) return "Este e-mail já tem conta.";
  if (codigo === "email_address_invalid") return "Este e-mail não é aceito. Use um e-mail válido.";
  if (codigo === "weak_password") return "Senha fraca. Use uma senha mais forte.";
  if (codigo === "over_request_rate_limit" || codigo === "over_email_send_rate_limit") return "Muitas tentativas. Aguarde um pouco e tente de novo.";
  return "Não foi possível concluir agora. Tente novamente.";
}

export async function entrarAction(email: string, senha: string): Promise<Resultado> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: senha });
  if (error) return { ok: false, mensagem: traduzirErro(error.code, error.message) };
  return { ok: true };
}

export async function cadastrarAction(dados: {
  nome: string; arroba: string; email: string; senha: string;
}): Promise<Resultado> {
  const supabase = await criarClienteServidor();
  const arroba = dados.arroba.trim().toLowerCase().replace(/^@/, "");

  const { data: livre, error: erroConsulta } = await supabase.rpc("arroba_disponivel", { candidato: arroba });
  if (erroConsulta) return { ok: false, mensagem: "Não foi possível conferir o @ agora. Tente novamente." };
  if (!livre) return { ok: false, mensagem: "Este @ já está em uso. Escolha outro." };

  const { data, error } = await supabase.auth.signUp({
    email: dados.email.trim().toLowerCase(),
    password: dados.senha,
    options: { data: { nome: dados.nome.trim(), arroba } },
  });
  if (error) return { ok: false, mensagem: traduzirErro(error.code, error.message) };
  if (!data.session) return { ok: false, mensagem: "Conta criada. Confirme seu e-mail para entrar." };
  return { ok: true };
}

export async function sairAction(): Promise<void> {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
