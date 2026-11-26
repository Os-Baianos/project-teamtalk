"use client";

import Link from "next/link";
import { CabecalhoMobile, LayoutMobile } from "@design/componentes";
import { Carregando } from "@design/componentes/carregando";
import { Avatar } from "../../../contatos/avatar";
import { BotoesRelacao } from "../../../contatos/botoes-relacao";
import type { ContatoDado, Relacao } from "../../../contatos/acoes";
import estilos from "./conta-contatos.module.css";

type Props = {
  carregando: boolean;
  recebidas: ContatoDado[];
  enviadas: ContatoDado[];
  contatos: ContatoDado[];
  /** Chamado depois de aceitar, recusar, cancelar ou remover: recarrega as listas. */
  aoMudar: () => void;
};

function Lista({ titulo, vazio, pessoas, relacao, aoMudar, carregando }: {
  carregando: boolean; titulo: string; vazio: string; pessoas: ContatoDado[]; relacao: Relacao; aoMudar: () => void;
}) {
  const id = `titulo-${relacao}`;
  return (
    <section className={estilos.secao} aria-labelledby={id}>
      <h2 id={id}>{titulo} <span className={estilos.quantos}>{pessoas.length}</span></h2>
      {carregando && pessoas.length === 0 ? (
        <Carregando tamanho="1.5rem" texto="Carregando" atraso />
      ) : pessoas.length === 0 ? (
        <p className={estilos.vazio}>{vazio}</p>
      ) : (
        <ul className={estilos.lista}>
          {pessoas.map((p) => (
            <li className={estilos.cartao} key={p.id}>
              <Link className={estilos.perfilLink} href={`/perfil/${p.arroba}`} aria-label={`Ver o perfil de ${p.nome}`}>
                <Avatar nome={p.nome} fotoUrl={p.foto_url} />
                <div className={estilos.dados}>
                  <strong>{p.nome}</strong>
                  <span>@{p.arroba}</span>
                </div>
              </Link>
              <BotoesRelacao pessoa={p} relacao={relacao} aoMudar={aoMudar} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Solicitações recebidas e enviadas e a lista de contatos (menu Conta > Contatos). */
export function TelaContaContatos({ carregando, recebidas, enviadas, contatos, aoMudar }: Props) {
  return (
    <LayoutMobile cabecalho={<CabecalhoMobile titulo="Meus contatos" subtitulo="Solicitações e pessoas da sua lista" />}>
      <Lista titulo="Solicitações recebidas" vazio="Nenhuma solicitação nova." carregando={carregando} pessoas={recebidas} relacao="recebida" aoMudar={aoMudar} />
      <Lista titulo="Solicitações enviadas" vazio="Você não tem solicitações pendentes." carregando={carregando} pessoas={enviadas} relacao="enviada" aoMudar={aoMudar} />
      <Lista titulo="Meus contatos" vazio="Você ainda não tem contatos. Busque alguém em Contatos." carregando={carregando} pessoas={contatos} relacao="contato" aoMudar={aoMudar} />
    </LayoutMobile>
  );
}
