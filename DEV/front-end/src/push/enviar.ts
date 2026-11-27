import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Manda a notificação de uma mensagem nova para os aparelhos de quem recebe.
 * Roda no servidor, depois que a mensagem já foi gravada. Qualquer falha é ignorada (a mensagem já foi enviada).
 */
export async function enviarPushDaMensagem(supabase: SupabaseClient, meuId: string, destinoId: string, texto: string) {
  const publica = process.env.VAPID_PUBLIC_KEY;
  const privada = process.env.VAPID_PRIVATE_KEY;
  if (!publica || !privada) return;
  try {
    const { data: destinos } = await supabase.rpc("push_destinos", { dest: destinoId });
    if (!destinos?.length) return;
    const { data: eu } = await supabase.from("perfis").select("nome, arroba, foto_path").eq("id", meuId).single();
    if (!eu) return;
    const foto = eu.foto_path ? supabase.storage.from("avatares").getPublicUrl(eu.foto_path).data.publicUrl : "/icones/icone-192.png";
    const carga = JSON.stringify({
      titulo: eu.nome,
      corpo: texto.length > 140 ? `${texto.slice(0, 137)}…` : texto,
      icone: foto,
      tag: `msg-${meuId}`,
      url: `/conversas?com=${encodeURIComponent(eu.arroba)}`,
    });
    webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:contato@teamtalk.app", publica, privada);
    await Promise.all((destinos as { endpoint: string; p256dh: string; auth: string }[]).map(async (d) => {
      try {
        await webpush.sendNotification({ endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } }, carga, { TTL: 60 * 60 * 24, urgency: "high" });
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await supabase.rpc("push_remover_morto", { dest: destinoId, ponto: d.endpoint });
      }
    }));
  } catch { /* sem notificação desta vez */ }
}
