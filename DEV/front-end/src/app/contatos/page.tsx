"use client";

import { useEffect, useState } from "react";
import { TelaContatos } from "./tela-contatos";
import type { Contato } from "./tela-contatos";
import {
  adicionarContatoAction,
  buscarPerfilAction,
  listarContatosAction,
  sugerirPerfisAction,
  removerContatoAction,
} from "../../contatos/acoes";

export default function PaginaContatos() {
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    listarContatosAction().then(setContatos).finally(() => setCarregando(false));
  }, []);

  async function adicionar(c: Contato) {
    const r = await adicionarContatoAction(c.arroba);
    if (r.ok) setContatos(await listarContatosAction());
  }

  async function remover(c: Contato) {
    const r = await removerContatoAction(c.id);
    if (r.ok) setContatos((atual) => atual.filter((x) => x.id !== c.id));
  }

  return (
    <TelaContatos
      carregando={carregando}
      contatos={contatos}
      buscar={buscarPerfilAction}
      sugerir={sugerirPerfisAction}
      aoAdicionar={adicionar}
      aoRemover={remover}
    />
  );
}
