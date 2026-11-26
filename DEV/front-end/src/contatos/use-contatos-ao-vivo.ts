"use client";

import { useEffect, useRef } from "react";
import { criarClienteNavegador } from "../supabase/navegador";

const EVENTO = "contatos-mudaram";
let contador = 0; // cada uso do hook precisa de um canal com nome próprio (o menu e a página usam ao mesmo tempo)

/** Avisa o resto da tela (ex.: o número no menu Conta) que as solicitações ou contatos mudaram. */
export function avisarMudancaDeContatos() {
  window.dispatchEvent(new Event(EVENTO));
}

/**
 * Chama `aoMudar` quando chega uma solicitação nova, um pedido é aceito, a aba volta a ficar visível
 * ou alguma ação desta aba muda os contatos. Cancelamentos/remoções feitos pela outra pessoa chegam
 * pela checagem a cada 20 s (o Supabase não filtra eventos de exclusão).
 */
export function useContatosAoVivo(meuId: string | null, aoMudar: () => void) {
  const ref = useRef(aoMudar);
  ref.current = aoMudar;

  useEffect(() => {
    if (!meuId) return;
    const chamar = () => ref.current();
    const supabase = criarClienteNavegador();
    const canal = supabase
      .channel(`contatos-${meuId}-${++contador}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "solicitacoes_contato", filter: `para_id=eq.${meuId}` }, chamar)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contatos", filter: `dono_id=eq.${meuId}` }, chamar)
      .subscribe();
    const visivel = () => { if (document.visibilityState === "visible") chamar(); };
    const intervalo = setInterval(visivel, 20_000);
    window.addEventListener(EVENTO, chamar);
    document.addEventListener("visibilitychange", visivel);
    return () => {
      supabase.removeChannel(canal);
      clearInterval(intervalo);
      window.removeEventListener(EVENTO, chamar);
      document.removeEventListener("visibilitychange", visivel);
    };
  }, [meuId]);
}
