"use client";

import { useEffect } from "react";
import { criarClienteNavegador } from "../supabase/navegador";
import type { Mensagem } from "./acoes";

/**
 * Avisa quando chega uma mensagem nova para mim (tempo real do Supabase).
 * Use na tela de conversa ou na lista; `aoReceber` recebe a mensagem.
 */
export function useMensagensAoVivo(meuId: string | null, aoReceber: (m: Mensagem) => void) {
  useEffect(() => {
    if (!meuId) return;
    const supabase = criarClienteNavegador();
    const canal = supabase
      .channel(`mensagens-${meuId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagens", filter: `destinatario_id=eq.${meuId}` },
        (payload) => aoReceber(payload.new as Mensagem),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [meuId, aoReceber]);
}
