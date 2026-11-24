import type { Regra } from "@design/componentes/lista-regras";

export type ModoLista = "oculta" | "somenteOk" | "completa";

/**
 * Quando e como mostrar as condições de um campo:
 * - digitando pela primeira vez: só confirma (✓) o que já está certo, sem reclamar;
 * - ao sair do campo com algo digitado (ou ao tentar enviar): mostra tudo, com ✕ no que falta;
 * - se estiver tudo certo ao sair do campo, a lista some;
 * - campos com uma única condição (nome, e-mail...) só mostram o aviso quando está errado, nunca o ✓.
 */
export function modoLista(valor: string, regras: Regra[], focado: boolean, validado: boolean): ModoLista {
  const tudoOk = regras.every((r) => r.ok);
  // Condição única (nome, e-mail...): só aparece o aviso de erro, nunca o ✓.
  if (regras.length === 1) return validado && !tudoOk ? "completa" : "oculta";
  if (validado) return tudoOk && !focado ? "oculta" : "completa";
  return focado && valor !== "" ? "somenteOk" : "oculta";
}
