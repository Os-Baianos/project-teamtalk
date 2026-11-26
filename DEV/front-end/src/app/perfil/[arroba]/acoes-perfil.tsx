"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Botao } from "@design/componentes";
import { excluirConversaAction } from "../../../mensagens/acoes";
import { avisarMudancaDeContatos } from "../../../contatos/use-contatos-ao-vivo";
import { BotoesRelacao } from "../../../contatos/botoes-relacao";
import type { Relacao } from "../../../contatos/acoes";
import estilos from "../perfil.module.css";

type Props = { id: string; arroba: string; relacao: Relacao; temConversa: boolean };

/** Botões do perfil de outra pessoa: solicitação, aceitar/recusar, remover e conversar. */
export function AcoesPerfil({ id, arroba, relacao: inicial, temConversa: inicialConversa }: Props) {
  const roteador = useRouter();
  const [relacao, setRelacao] = useState<Relacao>(inicial);
  const [temConversa, setTemConversa] = useState(inicialConversa);
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  async function excluirConversa() {
    setOcupado(true);
    setErro("");
    const ok = await excluirConversaAction(id);
    setOcupado(false);
    if (!ok) { setErro("Não foi possível excluir a conversa. Tente novamente."); return; }
    setTemConversa(false);
    setConfirmando(false);
    avisarMudancaDeContatos(); // atualiza a lista de conversas guardada
  }

  return (
    <div className={estilos.acoesPerfil}>
      {relacao === "contato" && (
        <Botao onClick={() => roteador.push(`/conversas?com=${encodeURIComponent(arroba)}`)}>Conversar</Botao>
      )}
      <BotoesRelacao pessoa={{ id, arroba }} relacao={relacao} aoMudar={(nova) => { if (relacao === "contato" && nova !== "contato") setTemConversa(false); setRelacao(nova); }} centralizado />
      {temConversa && !confirmando && (
        <Botao variante="perigo" onClick={() => setConfirmando(true)}>Excluir conversa</Botao>
      )}
      {temConversa && confirmando && (
        <>
          <p className={estilos.aviso}>A conversa some só para você. A outra pessoa continua vendo.</p>
          <Botao variante="perigo" ocupado={ocupado} onClick={excluirConversa}>Confirmar exclusão</Botao>
          <Botao variante="secundaria" disabled={ocupado} onClick={() => setConfirmando(false)}>Cancelar</Botao>
        </>
      )}
      {erro && <p role="alert" className={estilos.aviso}>{erro}</p>}
    </div>
  );
}
