import { criarClienteNavegador } from "../supabase/navegador";
import { DIAS_ANEXO } from "./anexos";

/**
 * Apaga do armazenamento os arquivos que EU enviei há mais de 7 dias e marca a mensagem como "Arquivo expirado".
 * Roda ao abrir as conversas; a limpeza diária do servidor cuida dos arquivos de quem não volta ao app.
 */
export async function limparAnexosVencidos(meuId: string) {
  try {
    const supabase = criarClienteNavegador();
    const limite = new Date(Date.now() - DIAS_ANEXO * 864e5).toISOString();
    const { data } = await supabase.from("mensagens").select("anexo_caminho")
      .eq("remetente_id", meuId).not("anexo_caminho", "is", null).lt("criado_em", limite).limit(100);
    const caminhos = (data ?? []).map((l) => l.anexo_caminho as string);
    if (caminhos.length === 0) return;
    await supabase.storage.from("anexos").remove(caminhos);
    await supabase.rpc("anexos_marcar_expirados", { caminhos });
  } catch { /* tenta de novo na próxima vez */ }
}
