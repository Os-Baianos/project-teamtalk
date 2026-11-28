import { after, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { criarClienteServidor } from "../../../../supabase/servidor";
import { enviarPushDaMensagem } from "../../../../push/enviar";
import { enviarPushDoGrupo } from "../../../../push/enviar";
import type { Mensagem } from "../../../../mensagens/acoes";
import { LIMITE_PDF, validarPdf } from "../../../../mensagens/pdf-validacao.mjs";

export const runtime = "nodejs";
export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SEM_CACHE = { "Cache-Control": "private, no-store" };

function resposta(erro: string, status: number) {
  return NextResponse.json({ ok: false, mensagem: erro }, { status, headers: SEM_CACHE });
}

function criarClientePrivilegiado() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) return null;
  return createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Upload do PDF validado no servidor; o browser envia a mensagem no mesmo pedido. */
export async function POST(request: Request) {
  const tamanhoPedido = Number(request.headers.get("content-length"));
  if (Number.isFinite(tamanhoPedido) && tamanhoPedido > LIMITE_PDF + 64 * 1024) {
    return resposta("O arquivo passa do limite de 10 MB.", 413);
  }

  const sessao = await criarClienteServidor();
  const { data: auth } = await sessao.auth.getClaims();
  const meuId = auth?.claims.sub;
  if (!meuId) return resposta("Entre para enviar arquivos.", 401);
  if (!UUID.test(meuId)) return resposta("Sessão inválida.", 401);

  let form: FormData;
  try { form = await request.formData(); }
  catch { return resposta("Não foi possível ler o arquivo enviado.", 400); }

  const arquivo = form.get("arquivo");
  const destinatarioId = form.get("destinatarioId");
  const grupoId = form.get("grupoId");
  const requestId = form.get("requestId");
  const texto = form.get("texto");
  const respondeA = form.get("respondeA");
  if (!arquivo || typeof arquivo === "string" || typeof requestId !== "string" || !UUID.test(requestId)) {
    return resposta("Pedido de envio inválido.", 400);
  }
  if (typeof texto !== "string" || texto.trim().length > 2000 || (respondeA !== null && (typeof respondeA !== "string" || !UUID.test(respondeA)))) {
    return resposta("A legenda ou a resposta não é válida.", 400);
  }
  const direto = typeof destinatarioId === "string" && UUID.test(destinatarioId);
  const grupo = typeof grupoId === "string" && UUID.test(grupoId);
  if (direto === grupo || (destinatarioId !== null && !direto) || (grupoId !== null && !grupo)) {
    return resposta("Conversa inválida.", 400);
  }

  if (direto) {
    const { data, error } = await sessao.from("contatos").select("contato_id")
      .eq("dono_id", meuId).eq("contato_id", destinatarioId).maybeSingle();
    if (error || !data) return resposta("Você não pode enviar arquivos para esta conversa.", 403);
  } else {
    const { data, error } = await sessao.rpc("pode_escrever_grupo", { g: grupoId });
    if (error || data !== true) return resposta("Você não pode enviar arquivos para este grupo.", 403);
  }

  if (arquivo.size > LIMITE_PDF) return resposta("O PDF deve ter no máximo 10 MB.", 413);
  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  const motivo = await validarPdf({ bytes, nome: arquivo.name, tipo: arquivo.type });
  if (motivo) return resposta(motivo, motivo.includes("10 MB") ? 413 : 415);

  const caminho = `${meuId}/${requestId.toLowerCase()}.pdf`;
  const admin = criarClientePrivilegiado();
  if (!admin) return resposta("O envio seguro de PDFs não está configurado no servidor.", 503);

  // Se a resposta anterior se perdeu depois do INSERT, devolve a mesma mensagem em vez de duplicá-la.
  const { data: existente } = await sessao.from("mensagens").select("*")
    .eq("remetente_id", meuId).eq("anexo_caminho", caminho).maybeSingle();
  if (existente) return NextResponse.json({ ok: true, mensagem: existente }, { headers: SEM_CACHE });

  const { error: erroUpload } = await admin.storage.from("anexos").upload(caminho, bytes, {
    contentType: "application/pdf", upsert: false,
  });
  if (erroUpload) {
    if (!erroUpload.message.toLowerCase().includes("already exists")) {
      return resposta("Não foi possível armazenar o PDF. Tente novamente.", 500);
    }
    // Recupera tentativas interrompidas após o upload; só reutiliza os mesmos bytes validados.
    const { data: anterior } = await admin.storage.from("anexos").download(caminho);
    if (!anterior) return resposta("Este envio já está sendo processado. Aguarde e tente novamente.", 409);
    const bytesAnteriores = new Uint8Array(await anterior.arrayBuffer());
    if (bytesAnteriores.byteLength !== bytes.byteLength || !Buffer.from(bytesAnteriores).equals(Buffer.from(bytes))) {
      return resposta("Este identificador de envio já está associado a outro arquivo.", 409);
    }
  }

  const mensagem = {
    remetente_id: meuId,
    destinatario_id: direto ? destinatarioId : null,
    grupo_id: grupo ? grupoId : null,
    texto: texto.trim(),
    responde_a: typeof respondeA === "string" ? respondeA : null,
    anexo_caminho: caminho,
    anexo_nome: arquivo.name,
    anexo_tipo: "application/pdf",
    anexo_tamanho: bytes.byteLength,
  };
  const { data, error } = await admin.from("mensagens").insert(mensagem).select("*").single();
  if (error || !data) {
    if (error?.code === "23505") {
      const { data: repetida } = await sessao.from("mensagens").select("*")
        .eq("remetente_id", meuId).eq("anexo_caminho", caminho).maybeSingle();
      if (repetida) return NextResponse.json({ ok: true, mensagem: repetida }, { headers: SEM_CACHE });
    }
    await admin.storage.from("anexos").remove([caminho]);
    return resposta("Não foi possível registrar o PDF na conversa. Tente novamente.", 500);
  }

  const resumo = texto.trim() || `Enviou um arquivo PDF: ${arquivo.name}`;
  if (direto) after(() => enviarPushDaMensagem(sessao, meuId, destinatarioId!, resumo));
  else after(() => enviarPushDoGrupo(sessao, meuId, grupoId!, resumo));
  return NextResponse.json({ ok: true, mensagem: data as Mensagem }, { status: 201, headers: SEM_CACHE });
}
