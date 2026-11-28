import assert from "node:assert/strict";
import { test } from "node:test";
import { PDFDocument } from "pdf-lib";
import { LIMITE_PDF, validarPdf } from "../src/mensagens/pdf-validacao.mjs";

async function pdfValido() {
  const documento = await PDFDocument.create();
  documento.addPage([100, 100]);
  return new Uint8Array(await documento.save());
}

test("aceita PDF válido abaixo de 10 MiB", async () => {
  assert.equal(await validarPdf({ bytes: await pdfValido(), nome: "relatório.pdf", tipo: "application/pdf" }), null);
});

test("aceita PDF válido com exatamente 10 MiB", async () => {
  const original = await pdfValido();
  const bytes = new Uint8Array(LIMITE_PDF);
  bytes.set(original);
  bytes.fill(0x20, original.length);
  assert.equal(await validarPdf({ bytes, nome: "limite.pdf", tipo: "application/pdf" }), null);
});

test("rejeita arquivo maior que 10 MiB", async () => {
  const bytes = new Uint8Array(LIMITE_PDF + 1);
  assert.match(await validarPdf({ bytes, nome: "grande.pdf", tipo: "application/pdf" }), /10 MB/u);
});

test("rejeita TXT, imagem e executável renomeados para PDF", async () => {
  for (const bytes of [new TextEncoder().encode("texto simples"), Uint8Array.from([0x89, 0x50, 0x4e, 0x47]), Uint8Array.from([0x4d, 0x5a, 0x90, 0])]) {
    assert.notEqual(await validarPdf({ bytes, nome: "arquivo.pdf", tipo: "application/pdf" }), null);
  }
});

test("rejeita extensão e MIME incompatíveis mesmo com bytes de PDF", async () => {
  const bytes = await pdfValido();
  assert.match(await validarPdf({ bytes, nome: "arquivo.txt", tipo: "application/pdf" }), /extensão/u);
  assert.match(await validarPdf({ bytes, nome: "arquivo.pdf", tipo: "image/png" }), /tipo informado/u);
});

test("rejeita conteúdo vazio e PDF estruturalmente malformado", async () => {
  assert.match(await validarPdf({ bytes: new Uint8Array(), nome: "vazio.pdf", tipo: "application/pdf" }), /vazio/u);
  assert.notEqual(await validarPdf({ bytes: new TextEncoder().encode("%PDF-1.7\nsem estrutura"), nome: "malformado.pdf", tipo: "application/pdf" }), null);
});

test("aceita MIME ausente somente quando nome e conteúdo comprovam PDF", async () => {
  assert.equal(await validarPdf({ bytes: await pdfValido(), nome: "sem-mime.pdf", tipo: "" }), null);
});
