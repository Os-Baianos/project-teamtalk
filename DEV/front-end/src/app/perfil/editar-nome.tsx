"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Botao, Campo } from "@design/componentes";
import { regrasNome, todasOk } from "../../design/validacoes";
import { editarNomeAction } from "./acoes";
import estilos from "./perfil.module.css";

/** Linha "Nome" do perfil, com edição no mesmo lugar. */
export function EditarNome({ nome }: { nome: string }) {
  const roteador = useRouter();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(nome);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar() {
    setOcupado(true);
    setErro("");
    const r = await editarNomeAction(valor);
    setOcupado(false);
    if (!r.ok) { setErro(r.mensagem ?? "Não foi possível salvar."); return; }
    setEditando(false);
    roteador.refresh();
  }

  if (!editando) {
    return (
      <>
        <dd>{nome}</dd>
        <div className={estilos.botaoCanto}>
          <Botao onClick={() => { setValor(nome); setErro(""); setEditando(true); }}>Editar</Botao>
        </div>
      </>
    );
  }
  return (
    <div className={estilos.edicaoNome}>
      <Campo id="novo-nome" rotulo="Nome completo" value={valor} autoComplete="name" maxLength={80}
        onChange={(e) => setValor(e.target.value)} erro={erro || undefined} />
      <div className={estilos.acoes}>
        <Botao ocupado={ocupado} disabled={!todasOk(regrasNome(valor))} onClick={salvar}>Salvar</Botao>
        <Botao variante="discreta" disabled={ocupado} onClick={() => setEditando(false)}>Cancelar</Botao>
      </div>
    </div>
  );
}
