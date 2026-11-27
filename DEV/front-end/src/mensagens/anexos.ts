/** Regras dos anexos das mensagens (iguais às do bucket "anexos" no Supabase). */
/** Limite do plano Free do Supabase (50 MB por arquivo). */
export const LIMITE_ANEXO = 50 * 1024 * 1024;
/** Depois disso o arquivo é apagado do servidor e a mensagem mostra "Arquivo expirado". */
export const DIAS_ANEXO = 7;

export const TIPOS_ANEXO = [
  "image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime", "application/pdf", "text/plain", "text/csv", "application/zip",
  "application/msword", "application/vnd.ms-excel", "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

export type Anexo = { caminho: string; nome: string; tipo: string; tamanho: number };

export const ehImagem = (tipo: string | null | undefined) => !!tipo && tipo.startsWith("image/");
export const ehVideo = (tipo: string | null | undefined) => !!tipo && tipo.startsWith("video/");
export const TIPOS_MIDIA = TIPOS_ANEXO.filter((t) => t.startsWith("image/") || t.startsWith("video/"));
export const TIPOS_DOCUMENTO = TIPOS_ANEXO.filter((t) => !t.startsWith("image/") && !t.startsWith("video/"));

/** Passou do prazo: o arquivo já não existe mais no servidor. */
export const anexoExpirado = (criadoEm: string, caminho: string | null | undefined) =>
  !caminho || Date.now() - new Date(criadoEm).getTime() > DIAS_ANEXO * 864e5;

export function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

/** Devolve o motivo de recusa ou null se o arquivo pode ser enviado. */
export function validarArquivo(f: File): string | null {
  if (f.size === 0) return "Esse arquivo está vazio.";
  if (f.size > LIMITE_ANEXO) return "Limite de tamanho ultrapassado: o arquivo passa de 50 MB.";
  if (!TIPOS_ANEXO.includes(f.type)) return "Esse tipo de arquivo não é aceito. Envie imagem, vídeo, PDF, Word, Excel, PowerPoint, TXT, CSV ou ZIP.";
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
