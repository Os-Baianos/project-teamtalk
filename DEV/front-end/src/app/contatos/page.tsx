"use client";

import { useEffect, useState } from "react";
import { TelaContatos } from "./tela-contatos";
import type { Contato } from "./tela-contatos";
import {
  adicionarContatoAction,
  buscarPerfilAction,
  listarContatosAction,
  removerContatoAction,
} from "../../contatos/acoes";

export default function PaginaContatos() {
  const [contatos, setContatos] = useState<Contato[]>([]);

  useEffect(() => {
    listarContatosAction().then(setContatos);
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
      contatos={contatos}
      buscar={buscarPerfilAction}
      aoAdicionar={adicionar}
      aoRemover={remover}
    />
  );
}
