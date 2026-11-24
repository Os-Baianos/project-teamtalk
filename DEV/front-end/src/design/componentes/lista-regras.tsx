"use client";

import { useEffect, useRef, useState } from "react";
import type { ModoLista } from "@design/modo-lista";
import estilos from "@design/componentes/lista-regras.module.css";

/** `texto` descreve o problema (✕); `textoOk` é como a regra aparece depois de corrigida (✓). */
export type Regra = { texto: string; ok: boolean; textoOk?: string };

type Props = {
  id: string;
  regras: Regra[];
  modo: ModoLista;
  /** Campo com o cursor; ao sair dele com tudo certo, a lista some. */
  focado: boolean;
};

/**
 * Mostra o que está errado (✕). Quando a pessoa conserta um item que estava errado, ele vira ✓.
 * Itens que nunca estiveram errados não aparecem, e a lista recolhe (com animação) ao sair do campo com tudo certo.
 */
export function ListaRegras({ id, regras, modo, focado }: Props) {
  const jaErraram = useRef(new Set<string>());
  const ultimos = useRef<Regra[]>([]);
  const [pronta, setPronta] = useState(false);

  let visiveis: Regra[] = [];
  if (modo === "oculta") {
    jaErraram.current.clear();
  } else {
    regras.forEach((r) => { if (!r.ok) jaErraram.current.add(r.texto); });
    const tudoOk = regras.every((r) => r.ok);
    visiveis = regras.filter((r) => !r.ok || jaErraram.current.has(r.texto));
    if (tudoOk && !focado) {
      jaErraram.current.clear();
      visiveis = [];
    }
  }

  const aberta = visiveis.length > 0;
  // Guarda o último conteúdo para a lista poder recolher com animação em vez de sumir de uma vez.
  if (aberta) ultimos.current = visiveis;
  const itens = aberta ? visiveis : ultimos.current;

  // Abre no quadro seguinte para a transição de altura ter de onde partir.
  useEffect(() => {
    const t = setTimeout(() => setPronta(aberta), aberta ? 20 : 0);
    return () => clearTimeout(t);
  }, [aberta]);

  if (itens.length === 0) return null;
  const aparente = aberta && pronta;

  return (
    <div className={estilos.recipiente} data-aberta={aparente} aria-hidden={!aparente}>
      <div className={estilos.interno}>
        <ul className={estilos.lista} id={id} aria-label="Condições">
          {itens.map((regra) => (
            <li className={estilos.regra} data-estado={regra.ok ? "ok" : "erro"} key={regra.texto}>
              <span className={estilos.marca} aria-hidden="true">{regra.ok ? "✓" : "✕"}</span>
              <span>
                <span className={estilos.leitor}>{regra.ok ? "Atendida: " : "Pendente: "}</span>
                {regra.ok ? (regra.textoOk ?? regra.texto) : regra.texto}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
