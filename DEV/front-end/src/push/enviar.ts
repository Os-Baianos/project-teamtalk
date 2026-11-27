import webpush from "./webpush";
import type { SupabaseClient } from "@supabase/supabase-js";

type Destino = { usuario_id?: string; endpoint: string; p256dh: string; auth: string };

/** Envia a mesma carga para os aparelhos e apaga os que não existem mais (404/410). */
async function enviarCarga(supabase: SupabaseClient, destinos: Destino[], donoPadrao: string | null, carga: string) {
  const publica = process.env.VAPID_PUBLIC_KEY;
  const privada = process.env.VAPID_PRIVATE_KEY;
  if (!publica || !privada) return;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:contato@teamtalk.app", publica, privada);
  await Promise.all(destinos.map(async (d) => {
    try {
      await webpush.sendNotification({ endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } }, carga, { TTL: 60 * 60 * 24, urgency: "high", timeout: 8000 });
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      console.error("push: falha ao enviar", status, (e as { body?: string }).body ?? "");
      const dono = d.usuario_id ?? donoPadrao;
      if ((status === 404 || status === 410) && dono) await supabase.rpc("push_remover_morto", { dest: dono, ponto: d.endpoint });
    }
  }));
}

const foto = (supabase: SupabaseClient, caminho: string | null) =>
  caminho ? supabase.storage.from("avatares").getPublicUrl(caminho).data.publicUrl : "/icones/icone-192.png";
const cortar = (texto: string) => (texto.length > 140 ? `${texto.slice(0, 137)}…` : texto);

/**
 * Manda a notificação de uma mensagem nova para os aparelhos de quem recebe.
 * Roda no servidor, depois que a mensagem já foi gravada. Qualquer falha é ignorada (a mensagem já foi enviada).
 */
export async function enviarPushDaMensagem(supabase: SupabaseClient, meuId: string, destinoId: string, texto: string) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;
  try {
    const { data: destinos, error } = await supabase.rpc("push_destinos", { dest: destinoId });
    if (error) console.error("push: destinos", error.message);
    if (!destinos?.length) return;
    const { data: eu } = await supabase.from("perfis").select("nome, arroba, foto_path").eq("id", meuId).single();
    if (!eu) return;
    const carga = JSON.stringify({
      titulo: eu.nome, corpo: cortar(texto), icone: foto(supabase, eu.foto_path),
      tag: `msg-${meuId}`, url: `/conversas?com=${encodeURIComponent(eu.arroba)}`,
    });
    await enviarCarga(supabase, destinos as Destino[], destinoId, carga);
  } catch (e) { console.error("push: erro", e); /* sem notificação desta vez */ }
}

/** Notificação de mensagem de grupo: título = nome do grupo, texto = "Fulano: mensagem". */
export async function enviarPushDoGrupo(supabase: SupabaseClient, meuId: string, grupoId: string, texto: string) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;
  try {
    const { data: destinos, error } = await supabase.rpc("push_destinos_grupo", { g: grupoId });
    if (error) console.error("push: destinos do grupo", error.message);
    if (!destinos?.length) return;
    const [{ data: eu }, { data: grupo }] = await Promise.all([
      supabase.from("perfis").select("nome, foto_path").eq("id", meuId).single(),
      supabase.from("grupos").select("nome").eq("id", grupoId).single(),
    ]);
    if (!eu || !grupo) return;
    const carga = JSON.stringify({
      titulo: grupo.nome, corpo: cortar(`${eu.nome}: ${texto}`), icone: foto(supabase, eu.foto_path),
      tag: `grupo-${grupoId}`, url: `/comunidades?g=${grupoId}`,
    });
    await enviarCarga(supabase, destinos as Destino[], null, carga);
  } catch (e) { console.error("push: erro no grupo", e); }
}
