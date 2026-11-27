"use client";

import { useMemo, useState } from "react";
import { Campo } from "@design/componentes";
import { Avatar } from "../contatos/avatar";
import estilos from "./grupos.module.css";

export type PessoaEscolha = { id: string; nome: string; arroba: string; foto_url: string | null };

/** Lista com busca e caixinhas para escolher várias pessoas. */
export function SeletorPessoas({ id, pessoas, marcados, aoAlternar, vazio = "Ninguém encontrado." }: {
  id: string;
  pessoas: PessoaEscolha[];
  marcados: Set<string>;
  aoAlternar: (pessoaId: string) => void;
  vazio?: string;
}) {
  const [filtro, setFiltro] = useState("");
  const visiveis = useMemo(() => {
    const t = filtro.trim().toLowerCase().replace(/^@/, "");
    return t ? pessoas.filter((p) => p.nome.toLowerCase().includes(t) || p.arroba.toLowerCase().includes(t)) : pessoas;
  }, [pessoas, filtro]);
  return (
    <div className={estilos.seletor}>
      <Campo id={id} rotulo="Buscar pessoa" value={filtro} onChange={(e) => setFiltro(e.target.value)} autoComplete="off" />
      <ul className={estilos.seletorLista} aria-label="Pessoas">
        {visiveis.map((p) => (
          <li key={p.id}>
            <label className={estilos.opcao}>
              <input type="checkbox" checked={marcados.has(p.id)} onChange={() => aoAlternar(p.id)} />
              <Avatar nome={p.nome} fotoUrl={p.foto_url} />
              <span className={estilos.nomes}><strong>{p.nome}</strong><span>@{p.arroba}</span></span>
            </label>
          </li>
        ))}
        {visiveis.length === 0 && <li className={estilos.vazio}>{vazio}</li>}
      </ul>
      <span className={estilos.contagem}>{marcados.size} selecionada{marcados.size === 1 ? "" : "s"}</span>
    </div>
  );
}
