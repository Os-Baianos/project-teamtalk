import { LIMITE_PDF } from "./pdf-constantes.mjs";

/** Regras dos anexos das mensagens. PDFs têm validação e limite próprios no servidor. */
/** Limite do plano Free do Supabase (50 MB por arquivo). */
export const LIMITE_ANEXO = 50 * 1024 * 1024;
export { LIMITE_PDF };
/** Depois disso o arquivo é apagado do servidor e a mensagem mostra "Arquivo expirado". */
export const DIAS_ANEXO = 7;

export const TIPOS_ANEXO = [
  "image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime", "application/pdf",
];

export type Anexo = { caminho: string; nome: string; tipo: string; tamanho: number };

export const ehImagem = (tipo: string | null | undefined) => !!tipo && tipo.startsWith("image/");
export const ehVideo = (tipo: string | null | undefined) => !!tipo && tipo.startsWith("video/");
export const TIPOS_MIDIA = TIPOS_ANEXO.filter((t) => t.startsWith("image/") || t.startsWith("video/"));
export const TIPOS_DOCUMENTO = ["application/pdf", ".pdf"];

/** Passou do prazo: o arquivo já não existe mais no servidor. */
export const anexoExpirado = (criadoEm: string, caminho: string | null | undefined, tipo?: string | null) =>
  !caminho || (tipo !== "application/pdf" && Date.now() - new Date(criadoEm).getTime() > DIAS_ANEXO * 864e5);

export function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

/** Devolve o motivo de recusa ou null se o arquivo pode ser enviado. */
export async function validarArquivo(f: File): Promise<string | null> {
  if (f.size === 0) return "Esse arquivo está vazio.";
  const extensaoPdf = f.name.toLocaleLowerCase("en-US").endsWith(".pdf");
  if (extensaoPdf || f.type === "application/pdf") {
    if (!extensaoPdf) return "Envie um arquivo com extensão .pdf.";
    if (f.type && f.type !== "application/pdf") return "O tipo informado não é PDF.";
    if ([...f.name].length > 200 || /[\\/\u0000-\u001f\u007f]/u.test(f.name)) return "O nome do arquivo é inválido ou muito longo.";
    if (f.size > LIMITE_PDF) return "O PDF deve ter no máximo 10 MB.";
    const bytes = new Uint8Array(await f.slice(0, 1024).arrayBuffer());
    const cabecalho = new TextDecoder("ascii").decode(bytes);
    if (!/%PDF-[0-9]\.[0-9]/u.test(cabecalho)) return "O conteúdo do arquivo não é um PDF válido.";
    return null;
  }
  if (f.size > LIMITE_ANEXO) return "Limite de tamanho ultrapassado: o arquivo passa de 50 MB.";
  if (!TIPOS_MIDIA.includes(f.type)) return "Envie um PDF, imagem ou vídeo em um formato aceito.";
  return null;
}

/** Nome seguro para o caminho no bucket (sem acentos, espaços ou barras). */
export function nomeSeguro(nome: string) {
  const limpo = nome.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return (limpo || "arquivo").slice(-80);
}

/** Texto curto que representa a mensagem (citação, prévia, notificação). */
export function resumoMensagem(texto: string, nome: string | null | undefined, tipo: string | null | undefined) {
  if (texto.trim()) return texto;
  if (!nome) return "";
  return ehImagem(tipo) ? "Foto" : ehVideo(tipo) ? "Vídeo" : nome;
}
