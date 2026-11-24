"use client";

import { useState } from "react";
import { TelaContatos } from "./tela-contatos";
import type { Contato } from "./tela-contatos";

// Dados provisórios: a busca e os contatos reais vêm do card [BACK] Buscar usuário e gerenciar contatos.
const usuarios: Contato[] = [
  { id: "1", nome: "Marina Souza", arroba: "marina" },
  { id: "2", nome: "Carlos Lima", arroba: "carlos" },
  { id: "3", nome: "Ana Ribeiro", arroba: "ana.r" },
];

export default function PaginaContatos() {
  const [contatos, setContatos] = useState<Contato[]>([]);

  return (
    <TelaContatos
      contatos={contatos}
      buscar={async (arroba) => usuarios.find((u) => u.arroba === arroba) ?? null}
      aoAdicionar={(c) => setContatos((atual) => [...atual, c])}
      aoRemover={(c) => setContatos((atual) => atual.filter((x) => x.id !== c.id))}
    />
  );
}
