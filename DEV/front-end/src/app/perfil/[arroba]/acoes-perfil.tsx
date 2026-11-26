"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Botao, MenuAcoes } from "@design/componentes";
import type { ItemMenuAcoes } from "@design/componentes";
import { BotoesRelacao } from "../../../contatos/botoes-relacao";
import { removerContatoAction } from "../../../contatos/acoes";
import type { Relacao } from "../../../contatos/acoes";
import { avisarMudancaDeContatos } from "../../../contatos/use-contatos-ao-vivo";
import { gravarCache } from "../../../cache/cache-local";
import { excluirConversaAction } from "../../../mensagens/acoes";
import estilos from "../perfil.module.css";

type Props = { id: string; arroba: string; relacao: Relacao; temConversa: boolean };

/** Botões do perfil de outra pessoa: Conversar em destaque e o menu "⋯" com remover contato e excluir conversa. */
export function AcoesPerfil({ id, arroba, relacao: inicial, temConversa: inicialConversa }: Props) {
  const roteador = useRouter();
  const [relacao, setRelacao] = useState<Relacao>(inicial);
  const [temConversa, setTemConversa] = useState(inicialConversa);

  const itens: ItemMenuAcoes[] = [];
  if (relacao === "contato") {
    itens.push({
      id: "remover", rotulo: "Remover contato", perigo: true,
      confirmacao: "Remover este contato? A conversa também será excluída, só para você.",
      aoEscolher: async () => {
        const r = await removerContatoAction(id);
        if (!r.ok) return r.mensagem ?? "Não foi possível agora. Tente novamente.";
        setRelacao("nenhuma");
        setTemConversa(false);
        gravarCache(`msgs:${id}`, []);
        avisarMudancaDeContatos();
        return null;
      },
    });
  }
  if (temConversa) {
    itens.push({
      id: "excluir", rotulo: "Excluir conversa", perigo: true,
      confirmacao: "A conversa some só para você. A outra pessoa continua vendo.",
      aoEscolher: async () => {
        if (!(await excluirConversaAction(id))) return "Não foi possível excluir a conversa. Tente novamente.";
        setTemConversa(false);
        gravarCache(`msgs:${id}`, []);
        avisarMudancaDeContatos(); // atualiza a lista de conversas guardada
        return null;
      },
    });
  }

  return (
    <div className={estilos.acoesPerfil}>
      {relacao === "contato" ? (
        <div className={estilos.linhaAcoes}>
          <Botao onClick={() => roteador.push(`/conversas?com=${encodeURIComponent(arroba)}`)}>Conversar</Botao>
          <MenuAcoes itens={itens} rotulo="Mais ações do contato" />
        </div>
      ) : (
        <>
          <BotoesRelacao pessoa={{ id, arroba }} relacao={relacao} aoMudar={setRelacao} centralizado />
          {itens.length > 0 && <MenuAcoes itens={itens} rotulo="Mais ações" />}
        </>
      )}
    </div>
  );
}
