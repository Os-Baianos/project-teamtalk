/** Regras dos anexos das mensagens (iguais às do bucket "anexos" no Supabase). */
export const LIMITE_ANEXO = 10 * 1024 * 1024;

export const TIPOS_ANEXO = [
  "image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf", "text/plain", "text/csv", "application/zip",
  "application/msword", "application/vnd.ms-excel", "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

export type Anexo = { caminho: string; nome: string; tipo: string; tamanho: number };

export const ehImagem = (tipo: string | null | undefined) => !!tipo && tipo.startsWith("image/");

export function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

/** Devolve o motivo de recusa ou null se o arquivo pode ser enviado. */
export function validarArquivo(f: File): string | null {
  if (f.size === 0) return "Esse arquivo está vazio.";
  if (f.size > LIMITE_ANEXO) return "O arquivo passa de 10 MB.";
  if (!TIPOS_ANEXO.includes(f.type)) return "Esse tipo de arquivo não é aceito. Envie imagem, PDF, Word, Excel, PowerPoint, TXT, CSV ou ZIP.";
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
  return ehImagem(tipo) ? "Foto" : nome;
}
