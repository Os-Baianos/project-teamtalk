"use client";

import { useCallback, useEffect, useState } from "react";
import { TelaContaContatos } from "./tela-conta-contatos";
import { carregarContaContatosAction } from "../../../contatos/acoes";
import type { ContatoDado, Solicitacoes } from "../../../contatos/acoes";
import { useContatosAoVivo } from "../../../contatos/use-contatos-ao-vivo";
import { lerCache, gravarCache } from "../../../cache/cache-local";
import { meuIdLocal } from "../../../supabase/meu-id";

type Dados = { solicitacoes: Solicitacoes; contatos: ContatoDado[] };

export default function PaginaContaContatos() {
  const [meuId, setMeuId] = useState<string | null>(null);
  const [dados, setDados] = useState<Dados>(() => ({ solicitacoes: { recebidas: [], enviadas: [] }, contatos: [] }));
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    const novos = await carregarContaContatosAction();
    gravarCache("conta-contatos", novos);
    setDados(novos);
    setCarregando(false);
  }, []);

  useEffect(() => {
    meuIdLocal().then(setMeuId);
    const guardado = lerCache<Dados>("conta-contatos");
    if (guardado) { setDados(guardado); setCarregando(false); }
    carregar();
  }, [carregar]);
  useContatosAoVivo(meuId, carregar);

  return (
    <TelaContaContatos
      carregando={carregando}
      recebidas={dados.solicitacoes.recebidas}
      enviadas={dados.solicitacoes.enviadas}
      contatos={dados.contatos}
      aoMudar={carregar}
    />
  );
}
