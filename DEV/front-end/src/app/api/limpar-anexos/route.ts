import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DIAS_ANEXO } from "../../../mensagens/anexos";

/**
 * Limpeza diária (Vercel Cron): apaga do armazenamento os arquivos enviados há mais de 7 dias, de todo mundo,
 * e deixa a mensagem como "Arquivo expirado". Precisa de CRON_SECRET e SUPABASE_SERVICE_ROLE_KEY no Vercel.
 */
export async function GET(requisicao: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || requisicao.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) return NextResponse.json({ erro: "falta SUPABASE_SERVICE_ROLE_KEY" }, { status: 503 });

  const supabase = createClient(url, chave, { auth: { persistSession: false } });
  const limite = new Date(Date.now() - DIAS_ANEXO * 864e5).toISOString();
  const { data, error } = await supabase.from("mensagens").select("id, anexo_caminho")
    .not("anexo_caminho", "is", null).lt("criado_em", limite).limit(500);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  const linhas = data ?? [];
  if (linhas.length === 0) return NextResponse.json({ apagados: 0 });

  const { error: erroRemover } = await supabase.storage.from("anexos").remove(linhas.map((l) => l.anexo_caminho as string));
  if (erroRemover) return NextResponse.json({ erro: erroRemover.message }, { status: 500 });
  await supabase.from("mensagens").update({ anexo_caminho: null }).in("id", linhas.map((l) => l.id));
  return NextResponse.json({ apagados: linhas.length });
}
