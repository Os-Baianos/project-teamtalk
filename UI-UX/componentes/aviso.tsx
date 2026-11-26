"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Icone } from "@design/icones/icone";
import estilos from "@design/componentes/aviso.module.css";

export type PropsAviso = {
  children: ReactNode;
  /** Chamado depois que o aviso termina de sumir (útil para lembrar que foi fechado). */
  aoFechar?: () => void;
  rotuloFechar?: string;
};

/** Aviso informativo: faixa azul com ícone de informação e botão de fechar. Some com animação suave. */
export function Aviso({ children, aoFechar, rotuloFechar = "Fechar aviso" }: PropsAviso) {
  const [estado, setEstado] = useState<"aberto" | "fechando" | "fechado">("aberto");
  const temporizador = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  if (estado === "fechado") return null;

  function fechar() {
    const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (semMovimento) {
      setEstado("fechado");
      aoFechar?.();
      return;
    }
    setEstado("fechando");
    temporizador.current = window.setTimeout(() => {
      setEstado("fechado");
      aoFechar?.();
    }, 260);
  }

  return (
    <div className={estilos.caixa} data-estado={estado}>
      <div className={estilos.conteudo}>
        <p role="status" className={estilos.aviso}>
          <Icone nome="informacao" width={20} height={20} className={estilos.icone} />
          <span className={estilos.texto}>{children}</span>
          <button type="button" className={estilos.fechar} aria-label={rotuloFechar} onClick={fechar}>
            <Icone nome="fechar" width={16} height={16} />
          </button>
        </p>
      </div>
    </div>
  );
}
