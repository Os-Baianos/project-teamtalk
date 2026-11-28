import type { Mensagem } from "./acoes";

type AlvoPdf = { destinatarioId?: string; grupoId?: string };
type RespostaPdf = { ok: true; mensagem: Mensagem } | { ok: false; mensagem: string };

export function ehArquivoPdf(arquivo: File) {
  return arquivo.type === "application/pdf" || arquivo.name.toLocaleLowerCase("en-US").endsWith(".pdf");
}

export async function enviarPdf(
  arquivo: File,
  requestId: string,
  alvo: AlvoPdf,
  texto: string,
  respondeA: string | null,
): Promise<RespostaPdf> {
  const form = new FormData();
  form.set("arquivo", arquivo, arquivo.name);
  form.set("requestId", requestId);
  form.set("texto", texto);
  if (respondeA) form.set("respondeA", respondeA);
  if (alvo.grupoId) form.set("grupoId", alvo.grupoId);
  else if (alvo.destinatarioId) form.set("destinatarioId", alvo.destinatarioId);
  else return { ok: false, mensagem: "Escolha uma conversa." };

  try {
    const resposta = await fetch("/api/anexos/pdf", { method: "POST", body: form, cache: "no-store" });
    const dados = await resposta.json().catch(() => null) as RespostaPdf | null;
    if (resposta.ok && dados?.ok && dados.mensagem) return dados;
    if (resposta.status === 413) return { ok: false, mensagem: "O servidor não aceitou o arquivo. Verifique se o limite de 10 MB está habilitado e tente novamente." };
    return { ok: false, mensagem: dados && !dados.ok ? dados.mensagem : "Não foi possível enviar o PDF. Verifique a conexão e tente novamente." };
  } catch {
    return { ok: false, mensagem: "Não foi possível enviar o PDF. Verifique a conexão e tente novamente." };
  }
}

export async function abrirOuBaixarPdf(mensagem: Mensagem, alvo: AlvoPdf, abrir: boolean): Promise<boolean> {
  if (!mensagem.anexo_caminho || !mensagem.anexo_nome) return false;
  const parametros = new URLSearchParams({ abrir: abrir ? "1" : "0" });
  if (alvo.grupoId) parametros.set("grupoId", alvo.grupoId);
  else if (alvo.destinatarioId) parametros.set("destinatarioId", alvo.destinatarioId);
  else return false;

  const aba = abrir ? window.open("about:blank", "_blank") : null;
  if (aba) aba.opener = null;
  try {
    const resposta = await fetch(`/api/anexos/pdf/${encodeURIComponent(mensagem.id)}?${parametros}`, { cache: "no-store" });
    if (!resposta.ok) { aba?.close(); return false; }
    const blob = await resposta.blob();
    const url = URL.createObjectURL(blob);
    if (abrir && aba) {
      aba.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } else if (abrir) {
      URL.revokeObjectURL(url);
      return false;
    } else {
      const link = document.createElement("a");
      link.href = url;
      link.download = mensagem.anexo_nome;
      link.rel = "noopener";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    }
    return true;
  } catch {
    aba?.close();
    return false;
  }
}
