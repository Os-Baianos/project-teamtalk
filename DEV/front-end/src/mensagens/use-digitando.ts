"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { criarClienteNavegador } from "../supabase/navegador";
import type { RealtimeChannel } from "@supabase/supabase-js";

const INTERVALO_AVISO = 2500; // quantas vezes por segundo avisamos que estamos digitando
const VALIDADE = 4000; // sem aviso novo por esse tempo, "digitando…" some

/**
 * "digitando…" ao vivo: usa um canal temporário só da dupla (nada vai para o banco).
 * `digitando` diz se a outra pessoa está digitando; `avisar` informa que EU estou (ou parei).
 */
export function useDigitando(meuId: string | null, outroId: string | null) {
  const [digitando, setDigitando] = useState(false);
  const canal = useRef<RealtimeChannel | null>(null);
  const ultimo = useRef(0);
  const fim = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setDigitando(false);
    if (!meuId || !outroId) return;
    const supabase = criarClienteNavegador();
    const c = supabase
      .channel(`digitando-${[meuId, outroId].sort().join("-")}`, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "digitando" }, ({ payload }) => {
        if (payload?.de !== outroId) return;
        clearTimeout(fim.current);
        const ativo = payload.ativo !== false;
        setDigitando(ativo);
        if (ativo) fim.current = setTimeout(() => setDigitando(false), VALIDADE);
      })
      .subscribe();
    canal.current = c;
    return () => {
      clearTimeout(fim.current);
      canal.current = null;
      supabase.removeChannel(c);
      setDigitando(false);
    };
  }, [meuId, outroId]);

  const avisar = useCallback((ativo = true) => {
    const c = canal.current;
    if (!c || !meuId) return;
    const agora = Date.now();
    if (ativo && agora - ultimo.current < INTERVALO_AVISO) return;
    ultimo.current = ativo ? agora : 0;
    void c.send({ type: "broadcast", event: "digitando", payload: { de: meuId, ativo } });
  }, [meuId]);

  /** Chegou mensagem dela: o "digitando…" acaba na hora. */
  const parar = useCallback(() => { clearTimeout(fim.current); setDigitando(false); }, []);

  return { digitando, avisar, parar };
}
