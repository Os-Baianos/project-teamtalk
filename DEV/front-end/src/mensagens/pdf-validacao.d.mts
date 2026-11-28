export const LIMITE_PDF: number;
export function validarPdf(arquivo: {
  bytes: Uint8Array;
  nome: string;
  tipo: string;
}): Promise<string | null>;
