"use client";

import { useRef } from "react";
import type { ModoLista } from "@design/modo-lista";
import estilos from "@design/componentes/lista-regras.module.css";

export type Regra = { texto: string; ok: boolean };

type Props = {
  id: string;
  regras: Regra[];
  modo: ModoLista;
  /** Campo com o cursor; ao sair dele com tudo certo, a lista some. */
  focado: boolean;
};

/**
 * Mostra o que está errado (✕). Quando a pessoa conserta um item que estava errado, ele vira ✓.
 * Itens que nunca estiveram errados não aparecem, e a lista some ao sair do campo com tudo certo.
 */
export function ListaRegras({ id, regras, modo, focado }: Props) {
  const jaErraram = useRef(new Set<string>());

  if (modo === "oculta") {
    jaErraram.current.clear();
    return null;
  }
  regras.forEach((r) => { if (!r.ok) jaErraram.current.add(r.texto); });

  const tudoOk = regras.every((r) => r.ok);
  const visiveis = regras.filter((r) => !r.ok || jaErraram.current.has(r.texto));
  if (visiveis.length === 0 || (tudoOk && !focado)) {
    if (tudoOk) jaErraram.current.clear();
    return null;
  }

  return (
    <ul className={estilos.lista} id={id} aria-label="Condições">
      {visiveis.map((regra) => (
        <li className={estilos.regra} data-estado={regra.ok ? "ok" : "erro"} key={regra.texto}>
          <span className={estilos.marca} aria-hidden="true">{regra.ok ? "✓" : "✕"}</span>
          <span>
            <span className={estilos.leitor}>{regra.ok ? "Atendida: " : "Pendente: "}</span>
            {regra.texto}
          </span>
        </li>
      ))}
    </ul>
  );
}
