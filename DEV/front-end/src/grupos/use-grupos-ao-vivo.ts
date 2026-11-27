"use client";

import { useEffect, useRef } from "react";
import { criarClienteNavegador } from "../supabase/navegador";
import type { Mensagem } from "../mensagens/acoes";

let contador = 0;

/**
 * Tempo real das comunidades:
 * - `aoNova` / `aoMudar`: mensagem de grupo nova ou alterada (o banco só entrega o que eu posso ver);
 * - `aoGrupo`: mudou algum grupo ou a lista de membros (nome, regra do chat, entrou, saiu, leu).
 */
export function useGruposAoVivo(
  meuId: string | null,
  aoNova: (m: Mensagem) => void,
  aoMudar: (m: Mensagem) => void,
  aoGrupo: () => void,
) {
  const nova = useRef(aoNova);
  const mudar = useRef(aoMudar);
  const grupo = useRef(aoGrupo);
  nova.current = aoNova;
  mudar.current = aoMudar;
  grupo.current = aoGrupo;

  useEffect(() => {
    if (!meuId) return;
    const supabase = criarClienteNavegador();
    const base = { schema: "public" } as const;
    const canal = supabase
      .channel(`grupos-${meuId}-${++contador}`)
      .on("postgres_changes", { ...base, table: "mensagens", event: "INSERT" }, (p) => { const m = p.new as Mensagem; if (m.grupo_id) nova.current(m); })
      .on("postgres_changes", { ...base, table: "mensagens", event: "UPDATE" }, (p) => { const m = p.new as Mensagem; if (m.grupo_id) mudar.current(m); })
      .on("postgres_changes", { ...base, table: "grupos", event: "*" }, () => grupo.current())
      .on("postgres_changes", { ...base, table: "grupo_membros", event: "*" }, () => grupo.current())
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, [meuId]);
}
