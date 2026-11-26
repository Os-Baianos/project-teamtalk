"use client";

import { useState } from "react";
import { Botao } from "@design/componentes";
import {
  aceitarSolicitacaoAction,
  cancelarSolicitacaoAction,
  recusarSolicitacaoAction,
  removerContatoAction,
  solicitarContatoAction,
} from "./acoes";
import type { Relacao, ResultadoContato } from "./acoes";
import { avisarMudancaDeContatos } from "./use-contatos-ao-vivo";
import estilos from "./botoes-relacao.module.css";

type Props = {
  pessoa: { id: string; arroba: string };
  relacao: Relacao;
  /** Chamado com a nova relação depois que a ação deu certo. */
  aoMudar: (nova: Relacao) => void;
  /** Botões no centro (perfil); o padrão é no canto direito do cartão. */
  centralizado?: boolean;
};

/** Os botões certos para cada situação: enviar, cancelar, aceitar/recusar ou remover (com confirmação). */
export function BotoesRelacao({ pessoa, relacao, aoMudar, centralizado = false }: Props) {
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState("");

  async function executar(nome: string, fazer: () => Promise<ResultadoContato>) {
    setOcupado(nome);
    setErro("");
    const r = await fazer();
    setOcupado(null);
    setConfirmando(false);
    if (!r.ok) { setErro(r.mensagem ?? "Não foi possível agora."); return; }
    avisarMudancaDeContatos();
    aoMudar(r.relacao ?? "nenhuma");
  }

  return (
    <div className={estilos.caixa} data-centro={centralizado}>
      <div className={estilos.botoes}>
        {relacao === "nenhuma" && (
          <Botao ocupado={ocupado === "enviar"} onClick={() => executar("enviar", () => solicitarContatoAction(pessoa.arroba))}>
            Enviar solicitação
          </Botao>
        )}
        {relacao === "enviada" && (
          <Botao variante="secundaria" ocupado={ocupado === "cancelar"} onClick={() => executar("cancelar", () => cancelarSolicitacaoAction(pessoa.id))}>
            Cancelar solicitação
          </Botao>
        )}
        {relacao === "recebida" && (
          <>
            <Botao ocupado={ocupado === "aceitar"} disabled={ocupado === "recusar"} onClick={() => executar("aceitar", () => aceitarSolicitacaoAction(pessoa.id))}>
              Aceitar
            </Botao>
            <Botao variante="secundaria" ocupado={ocupado === "recusar"} disabled={ocupado === "aceitar"} onClick={() => executar("recusar", () => recusarSolicitacaoAction(pessoa.id))}>
              Recusar
            </Botao>
          </>
        )}
        {relacao === "contato" && !confirmando && (
          <Botao variante="perigo" onClick={() => setConfirmando(true)}>Remover</Botao>
        )}
        {relacao === "contato" && confirmando && (
          <>
            <Botao variante="perigo" ocupado={ocupado === "remover"} onClick={() => executar("remover", () => removerContatoAction(pessoa.id))}>
              Remover e excluir conversa
            </Botao>
            <Botao variante="secundaria" disabled={ocupado === "remover"} onClick={() => setConfirmando(false)}>Cancelar</Botao>
          </>
        )}
      </div>
      {erro && <p className={estilos.erro} role="alert">{erro}</p>}
    </div>
  );
}
