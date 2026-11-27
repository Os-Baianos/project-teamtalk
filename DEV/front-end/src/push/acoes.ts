"use server";

import { criarClienteServidor } from "../supabase/servidor";

export type AssinaturaPush = { endpoint: string; keys: { p256dh: string; auth: string } };

/** Chave pública das notificações (lida do servidor para não depender do build). */
export async function obterChavePublicaAction(): Promise<string | null> {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

/** Guarda o aparelho da pessoa logada (o banco só deixa gravar o próprio). */
export async function salvarAssinaturaAction(sub: AssinaturaPush): Promise<boolean> {
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return false;
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getClaims();
  const meuId = auth?.claims.sub;
  if (!meuId) return false;
  // Se o aparelho já estava ligado a outra conta (troca de login), passa para esta.
  await supabase.from("push_assinaturas").delete().eq("endpoint", sub.endpoint);
  const { error } = await supabase.from("push_assinaturas").insert({
    usuario_id: meuId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth,
  });
  return !error;
}

export async function removerAssinaturaAction(endpoint: string): Promise<boolean> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("push_assinaturas").delete().eq("endpoint", endpoint);
  return !error;
}
