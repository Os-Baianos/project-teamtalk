"use client";

import { useEffect, useRef } from "react";
import { criarClienteNavegador } from "../supabase/navegador";
import type { Mensagem } from "./acoes";

let contador = 0;

/**
 * Tempo real das mensagens:
 * - `aoReceber`: chegou uma mensagem nova para mim;
 * - `aoAtualizar`: uma mensagem minha ou para mim mudou (recebida, lida, editada, apagada).
 */
export function useMensagensAoVivo(
  meuId: string | null,
  aoReceber: (m: Mensagem) => void,
  aoAtualizar?: (m: Mensagem) => void,
) {
  const receber = useRef(aoReceber);
  const atualizar = useRef(aoAtualizar);
  receber.current = aoReceber;
  atualizar.current = aoAtualizar;

  useEffect(() => {
    if (!meuId) return;
    const supabase = criarClienteNavegador();
    const base = { schema: "public", table: "mensagens" } as const;
    const canal = supabase
      .channel(`mensagens-${meuId}-${++contador}`)
      .on("postgres_changes", { ...base, event: "INSERT", filter: `destinatario_id=eq.${meuId}` }, (p) => receber.current(p.new as Mensagem))
      .on("postgres_changes", { ...base, event: "UPDATE", filter: `remetente_id=eq.${meuId}` }, (p) => atualizar.current?.(p.new as Mensagem))
      .on("postgres_changes", { ...base, event: "UPDATE", filter: `destinatario_id=eq.${meuId}` }, (p) => atualizar.current?.(p.new as Mensagem))
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [meuId]);
}
