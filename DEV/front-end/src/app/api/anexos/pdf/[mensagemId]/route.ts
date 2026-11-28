import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { criarClienteServidor } from "../../../../../supabase/servidor";
import { anexoExpirado } from "../../../../../mensagens/anexos";
import { LIMITE_PDF, validarPdf } from "../../../../../mensagens/pdf-validacao.mjs";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SEM_CACHE = { "Cache-Control": "private, no-store" };

function erro(status: number) {
  return NextResponse.json({ mensagem: "O arquivo não está disponível para esta conversa." }, { status, headers: SEM_CACHE });
}

function nomeDisposicao(nome: string, abrir: boolean) {
  const fallback = nome.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  const utf8 = encodeURIComponent(nome).replace(/[!'()*]/g, (caractere) => `%${caractere.charCodeAt(0).toString(16).toUpperCase()}`);
  return `${abrir ? "inline" : "attachment"}; filename="${fallback}"; filename*=UTF-8''${utf8}`;
}

export async function GET(request: Request, { params }: { params: Promise<{ mensagemId: string }> }) {
  const { mensagemId } = await params;
  if (!UUID.test(mensagemId)) return erro(404);
  const url = new URL(request.url);
  const grupoId = url.searchParams.get("grupoId");
  const destinatarioId = url.searchParams.get("destinatarioId");
  if ((grupoId && (!UUID.test(grupoId) || destinatarioId)) || (destinatarioId && !UUID.test(destinatarioId))) return erro(404);

  const sessao = await criarClienteServidor();
  const { data: auth } = await sessao.auth.getClaims();
  const meuId = auth?.claims.sub;
  if (!meuId) return erro(401);

  let consulta = sessao.from("mensagens").select("id, remetente_id, destinatario_id, grupo_id, criado_em, anexo_caminho, anexo_nome, anexo_tipo, anexo_tamanho, apagada_em")
    .eq("id", mensagemId).is("apagada_em", null);
  if (grupoId) consulta = consulta.eq("grupo_id", grupoId);
  else if (destinatarioId && destinatarioId !== meuId) {
    consulta = consulta.is("grupo_id", null).or(`and(remetente_id.eq.${meuId},destinatario_id.eq.${destinatarioId}),and(remetente_id.eq.${destinatarioId},destinatario_id.eq.${meuId})`);
  } else return erro(404);

  const { data: mensagem } = await consulta.maybeSingle();
  if (!mensagem || mensagem.anexo_tipo !== "application/pdf" || !mensagem.anexo_caminho || !mensagem.anexo_nome) return erro(404);
  if (grupoId ? mensagem.grupo_id !== grupoId : !(mensagem.remetente_id === meuId && mensagem.destinatario_id === destinatarioId || mensagem.destinatario_id === meuId && mensagem.remetente_id === destinatarioId)) return erro(404);
  if (anexoExpirado(mensagem.criado_em, mensagem.anexo_caminho, mensagem.anexo_tipo)) return erro(404);

  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!chave || !supabaseUrl) return erro(503);
  const admin = createClient(supabaseUrl, chave, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: arquivo, error: erroArquivo } = await admin.storage.from("anexos").download(mensagem.anexo_caminho);
  if (erroArquivo || !arquivo || arquivo.size > LIMITE_PDF) return erro(404);
  const conteudo = await arquivo.arrayBuffer();
  const bytes = new Uint8Array(conteudo);
  if (mensagem.anexo_tamanho !== bytes.byteLength) return erro(404);
  if (await validarPdf({ bytes, nome: mensagem.anexo_nome, tipo: mensagem.anexo_tipo })) return erro(404);

  const abrir = url.searchParams.get("abrir") === "1";
  return new Response(conteudo, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": nomeDisposicao(mensagem.anexo_nome, abrir),
      "Content-Length": String(bytes.byteLength),
      "X-Content-Type-Options": "nosniff",
      ...SEM_CACHE,
    },
  });
}
