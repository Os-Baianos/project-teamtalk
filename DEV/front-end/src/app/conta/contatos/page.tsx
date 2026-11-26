"use client";

import { useCallback, useEffect, useState } from "react";
import { TelaContaContatos } from "./tela-conta-contatos";
import { listarContatosAction, listarSolicitacoesAction } from "../../../contatos/acoes";
import type { ContatoDado, Solicitacoes } from "../../../contatos/acoes";
import { useContatosAoVivo } from "../../../contatos/use-contatos-ao-vivo";
import { meuIdAction } from "../../../mensagens/acoes";

export default function PaginaContaContatos() {
  const [meuId, setMeuId] = useState<string | null>(null);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacoes>({ recebidas: [], enviadas: [] });
  const [contatos, setContatos] = useState<ContatoDado[]>([]);

  const carregar = useCallback(async () => {
    const [s, c] = await Promise.all([listarSolicitacoesAction(), listarContatosAction()]);
    setSolicitacoes(s);
    setContatos(c);
  }, []);

  useEffect(() => {
    meuIdAction().then(setMeuId);
    carregar();
  }, [carregar]);
  useContatosAoVivo(meuId, carregar);

  return <TelaContaContatos recebidas={solicitacoes.recebidas} enviadas={solicitacoes.enviadas} contatos={contatos} aoMudar={carregar} />;
}
