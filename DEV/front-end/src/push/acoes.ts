"use server";

import webpush from "web-push";
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

/** Manda uma notificação de teste para os aparelhos da própria pessoa e diz o que aconteceu com cada um. */
export async function enviarPushTesteAction(): Promise<{ ok: boolean; mensagem: string }> {
  const publica = process.env.VAPID_PUBLIC_KEY;
  const privada = process.env.VAPID_PRIVATE_KEY;
  if (!publica || !privada) return { ok: false, mensagem: "Servidor sem as chaves de notificação." };
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims.sub) return { ok: false, mensagem: "Entre novamente para testar." };
  const { data: aparelhos, error } = await supabase.from("push_assinaturas").select("endpoint, p256dh, auth");
  if (error) return { ok: false, mensagem: "Não foi possível consultar seus aparelhos." };
  if (!aparelhos?.length) return { ok: false, mensagem: "Este aparelho não está registrado. Desative e ative de novo." };
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:contato@teamtalk.app", publica, privada);
  const carga = JSON.stringify({ titulo: "TeamTalk", corpo: "Notificação de teste: está funcionando!", icone: "/icones/icone-192.png", tag: "teste", url: "/configuracoes", forcar: true });
  const falhas: string[] = [];
  for (const a of aparelhos) {
    try {
      await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, carga, { TTL: 60, urgency: "high" });
    } catch (e) {
      const st = (e as { statusCode?: number }).statusCode;
      falhas.push(String(st ?? "erro"));
      if (st === 404 || st === 410) await supabase.from("push_assinaturas").delete().eq("endpoint", a.endpoint);
    }
  }
  if (falhas.length === aparelhos.length) {
    return { ok: false, mensagem: `O envio falhou (${falhas.join(", ")}). ${falhas.some((f) => f === "404" || f === "410") ? "O aparelho expirou: ative de novo." : "Tente de novo em instantes."}` };
  }
  return { ok: true, mensagem: `Teste enviado para ${aparelhos.length - falhas.length} aparelho(s). Se não aparecer, veja as configurações de notificação do navegador/aparelho.` };
}
