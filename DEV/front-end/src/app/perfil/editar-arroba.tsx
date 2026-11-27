"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Aviso, Botao, Campo } from "@design/componentes";
import { regrasArroba, todasOk } from "../../design/validacoes";
import { limparCache } from "../../cache/cache-local";
import { editarArrobaAction } from "./acoes";
import estilos from "./perfil.module.css";

type Props = { arroba: string; /** Data (ISO) em que a pessoa poderá trocar de novo; ausente quando já pode. */ liberadoEm?: string | null };

const data = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

/** Linha "Usuário (@)" do perfil: troca no mesmo lugar, no máximo uma vez a cada 30 dias. */
export function EditarArroba({ arroba, liberadoEm }: Props) {
  const roteador = useRouter();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(arroba);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const bloqueado = !!liberadoEm && new Date(liberadoEm).getTime() > Date.now();

  async function salvar() {
    setOcupado(true);
    setErro("");
    const r = await editarArrobaAction(valor);
    setOcupado(false);
    if (!r.ok) { setErro(r.mensagem ?? "Não foi possível salvar."); return; }
    limparCache(); // listas guardadas ainda têm o @ antigo
    setEditando(false);
    roteador.refresh();
  }

  if (!editando) {
    return (
      <>
        <dd>@{arroba}</dd>
        {bloqueado && <dd className={estilos.dica}>Você poderá trocar de novo em {data(liberadoEm!)}.</dd>}
        {!bloqueado && (
          <div className={estilos.botaoCanto}>
            <Botao onClick={() => { setValor(arroba); setErro(""); setEditando(true); }}>Editar</Botao>
          </div>
        )}
      </>
    );
  }
  return (
    <div className={estilos.edicaoNome}>
      <Aviso>Depois de trocar, você só poderá mudar o @ de novo daqui a 30 dias. Quem tem você como contato continua com você.</Aviso>
      <Campo id="novo-arroba" rotulo="Usuário (@)" value={valor} autoCapitalize="none" spellCheck={false} maxLength={20}
        ajuda="De 3 a 20 caracteres: letras minúsculas, números, ponto ou _, começando com letra."
        onChange={(e) => setValor(e.target.value.toLowerCase().replace(/^@/, ""))} erro={erro || undefined} />
      <div className={estilos.acoes}>
        <Botao ocupado={ocupado} disabled={!todasOk(regrasArroba(valor)) || valor === arroba} onClick={salvar}>Salvar</Botao>
        <Botao variante="discreta" disabled={ocupado} onClick={() => setEditando(false)}>Cancelar</Botao>
      </div>
    </div>
  );
}
