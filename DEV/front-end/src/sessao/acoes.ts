"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { contaDemo } from "../mock/conta-demo";
import { NOME_COOKIE_SESSAO } from "./constantes";

const OITO_HORAS = 60 * 60 * 8;

// Provisório: a sessão real vem do Supabase Auth no card [BACK] Cadastro e login (#118).
// Quando ele entrar, só o corpo destas duas funções muda; as telas continuam iguais.
export async function entrarAction(email: string, senha: string): Promise<{ ok: boolean }> {
  if (email.trim().toLowerCase() !== contaDemo.email || senha !== contaDemo.senha) {
    return { ok: false };
  }
  (await cookies()).set(NOME_COOKIE_SESSAO, "demo", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OITO_HORAS,
  });
  return { ok: true };
}

export async function sairAction(): Promise<void> {
  (await cookies()).delete(NOME_COOKIE_SESSAO);
  redirect("/login");
}
