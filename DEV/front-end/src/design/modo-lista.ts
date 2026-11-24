import type { Regra } from "@design/componentes/lista-regras";

export type ModoLista = "oculta" | "pendentes";

/**
 * A lista mostra somente o que ainda está errado (✕); o que já foi atendido some.
 * - Campo com várias condições (senha, @): acompanha a digitação, para a pessoa ver o que falta.
 * - Campo com uma condição (nome, e-mail): só reclama depois de sair do campo com algo digitado
 *   ou ao tentar enviar, para não avisar enquanto ainda está escrevendo.
 */
export function modoLista(valor: string, regras: Regra[], validado: boolean): ModoLista {
  if (regras.length === 1) return validado ? "pendentes" : "oculta";
  return valor !== "" || validado ? "pendentes" : "oculta";
}
