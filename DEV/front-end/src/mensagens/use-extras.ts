"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { criarClienteNavegador } from "../supabase/navegador";
import type { Mensagem } from "./acoes";
import { lerEnquetes, lerPessoas, votarEnquete } from "./extras";
import type { DadosEnquete, PessoaCartao } from "./extras";
import { encerrarEnqueteAction } from "./extras-acoes";

let contador = 0;

/** Carrega os cartões de contato e as enquetes das mensagens na tela e mantém os votos ao vivo. */
export function useExtras(meuId: string | null, mensagens: Mensagem[]) {
  const [pessoas, setPessoas] = useState<Record<string, PessoaCartao>>({});
  const [enquetes, setEnquetes] = useState<Record<string, DadosEnquete>>({});
  const idsEnquete = mensagens.filter((m) => m.enquete && !m.apagada_em && !m.id.startsWith("tmp-")).map((m) => m.id).join(",");
  const idsPessoa = [...new Set(mensagens.filter((m) => m.contato_ref && !m.apagada_em).map((m) => m.contato_ref as string))].join(",");
  const ids = useRef(idsEnquete);
  ids.current = idsEnquete;

  const recarregar = useCallback(async () => {
    if (!meuId || !ids.current) return;
    const novas = await lerEnquetes(ids.current.split(","), meuId);
    setEnquetes((a) => ({ ...a, ...novas }));
  }, [meuId]);

  useEffect(() => { void recarregar(); }, [idsEnquete, recarregar]);
  useEffect(() => {
    const faltam = idsPessoa.split(",").filter((id) => id && !pessoas[id]);
    if (faltam.length === 0) return;
    void lerPessoas(faltam).then((novas) => setPessoas((a) => ({ ...a, ...novas })));
  }, [idsPessoa, pessoas]);

  // Voto novo, enquete criada ou encerrada: atualiza na hora.
  useEffect(() => {
    if (!meuId) return;
    const supabase = criarClienteNavegador();
    const canal = supabase.channel(`enquetes-${meuId}-${++contador}`)
      .on("postgres_changes", { schema: "public", table: "enquete_votos", event: "*" }, () => void recarregar())
      .on("postgres_changes", { schema: "public", table: "enquetes", event: "*" }, () => void recarregar())
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, [meuId, recarregar]);

  /** Marca/desmarca o voto; a tela muda na hora e o banco confirma. */
  async function votar(msg: string, opcao: string, marcar: boolean) {
    const antes = enquetes[msg];
    if (!antes || antes.encerrada) return false;
    setEnquetes((a) => {
      const e = a[msg];
      if (!e) return a;
      const opcoes = e.opcoes.map((o) => {
        if (o.id === opcao) return { ...o, meuVoto: marcar, votos: o.votos + (marcar === o.meuVoto ? 0 : marcar ? 1 : -1) };
        if (marcar && !e.multipla && o.meuVoto) return { ...o, meuVoto: false, votos: o.votos - 1 };
        return o;
      });
      return { ...a, [msg]: { ...e, opcoes } };
    });
    const ok = await votarEnquete(msg, opcao, marcar);
    await recarregar();
    return ok;
  }

  async function encerrar(msg: string) {
    const ok = await encerrarEnqueteAction(msg);
    if (ok) await recarregar();
    return ok;
  }

  return { pessoas, enquetes, votar, encerrar };
}
