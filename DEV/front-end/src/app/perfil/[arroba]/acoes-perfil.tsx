"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Botao } from "@design/componentes";
import { BotoesRelacao } from "../../../contatos/botoes-relacao";
import type { Relacao } from "../../../contatos/acoes";
import estilos from "../perfil.module.css";

type Props = { id: string; arroba: string; relacao: Relacao };

/** Botões do perfil de outra pessoa: solicitação, aceitar/recusar, remover e conversar. */
export function AcoesPerfil({ id, arroba, relacao: inicial }: Props) {
  const roteador = useRouter();
  const [relacao, setRelacao] = useState<Relacao>(inicial);

  return (
    <div className={estilos.acoesPerfil}>
      {relacao === "contato" && (
        <Botao onClick={() => roteador.push(`/conversas?com=${encodeURIComponent(arroba)}`)}>Conversar</Botao>
      )}
      <BotoesRelacao pessoa={{ id, arroba }} relacao={relacao} aoMudar={setRelacao} centralizado />
    </div>
  );
}
