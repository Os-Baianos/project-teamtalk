"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Botao } from "@design/componentes";
import { adicionarContatoAction, removerContatoAction } from "../../../contatos/acoes";
import estilos from "../perfil.module.css";

type Props = { id: string; arroba: string; contato: boolean };

/** Adicionar ou remover dos contatos e abrir a conversa. */
export function AcoesPerfil({ id, arroba, contato }: Props) {
  const roteador = useRouter();
  const [ehContato, setEhContato] = useState(contato);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  async function alternar() {
    setOcupado(true);
    setErro("");
    if (ehContato) {
      const r = await removerContatoAction(id);
      if (r.ok) setEhContato(false); else setErro("Não foi possível remover agora.");
    } else {
      const r = await adicionarContatoAction(arroba);
      if (r.ok) setEhContato(true); else setErro(r.mensagem ?? "Não foi possível adicionar agora.");
    }
    setOcupado(false);
  }

  return (
    <>
      <div className={estilos.acoes}>
        {ehContato && <Botao onClick={() => roteador.push(`/conversas?com=${encodeURIComponent(arroba)}`)}>Conversar</Botao>}
        <Botao variante={ehContato ? "perigo" : "primaria"} ocupado={ocupado} onClick={alternar}>
          {ehContato ? "Remover dos contatos" : "Adicionar aos contatos"}
        </Botao>
      </div>
      {erro && <p className={estilos.erro} role="alert">{erro}</p>}
    </>
  );
}
