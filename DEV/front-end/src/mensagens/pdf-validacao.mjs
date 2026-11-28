import { PDFDocument } from "pdf-lib";
import { LIMITE_PDF } from "./pdf-constantes.mjs";

export { LIMITE_PDF };

/** Confere metadados e conteúdo real antes de aceitar um PDF no servidor. */
export async function validarPdf({ bytes, nome, tipo }) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) return "Esse arquivo está vazio.";
  if (bytes.byteLength > LIMITE_PDF) return "O PDF deve ter no máximo 10 MB.";
  if (typeof nome !== "string" || !nome.toLocaleLowerCase("en-US").endsWith(".pdf")) return "Envie um arquivo com extensão .pdf.";
  if ([...nome].length > 200 || /[\\/\u0000-\u001f\u007f]/u.test(nome)) return "O nome do arquivo é inválido ou muito longo.";
  if (tipo && tipo !== "application/pdf") return "O tipo informado não é PDF.";

  const cabecalho = new TextDecoder("ascii").decode(bytes.subarray(0, Math.min(bytes.length, 1024)));
  if (!/%PDF-[0-9]\.[0-9]/u.test(cabecalho)) return "O conteúdo do arquivo não é um PDF válido.";
  const marcadorFim = new TextEncoder().encode("%%EOF");
  let fim = -1;
  for (let i = bytes.length - marcadorFim.length; i >= 0; i--) {
    if (marcadorFim.every((byte, indice) => bytes[i + indice] === byte)) { fim = i; break; }
  }
  if (fim < 0 || !bytes.subarray(fim + marcadorFim.length).every((byte) => [0, 9, 10, 12, 13, 32].includes(byte))) {
    return "O arquivo PDF está malformado.";
  }
  const indiceInicio = Math.max(0, fim - 2048);
  const final = new TextDecoder("ascii").decode(bytes.subarray(indiceInicio, fim));
  if (!/startxref\s+\d+\s*$/u.test(final)) return "O arquivo PDF está malformado.";

  try {
    await PDFDocument.load(bytes, { updateMetadata: false, throwOnInvalidObject: true });
  } catch {
    return "O arquivo PDF está malformado ou protegido por senha.";
  }
  return null;
}
