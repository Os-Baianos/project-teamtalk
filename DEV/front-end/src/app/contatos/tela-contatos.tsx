"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Botao, Campo, CabecalhoMobile, LayoutMobile } from "@design/componentes";
import estilos from "./contatos.module.css";

export type Contato = { id: string; nome: string; arroba: string };

type Props = {
  contatos: Contato[];
  /** Procura um usuário pelo @; devolve null quando não existe. */
  buscar: (arroba: string) => Promise<Contato | null>;
  aoAdicionar: (contato: Contato) => void;
  aoRemover: (contato: Contato) => void;
};

const normalizar = (valor: string) => valor.trim().replace(/^@/, "").toLowerCase();

export function TelaContatos({ contatos, buscar, aoAdicionar, aoRemover }: Props) {
  const [termo, setTermo] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState<Contato | null>(null);
  const [mensagem, setMensagem] = useState("");

  async function procurar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const arroba = normalizar(termo);
    if (!arroba) return;
    setBuscando(true);
    setMensagem("");
    setResultado(null);
    const encontrado = await buscar(arroba);
    setBuscando(false);
    if (!encontrado) setMensagem(`Nenhum usuário encontrado com @${arroba}.`);
    else setResultado(encontrado);
  }

  const jaAdicionado = resultado ? contatos.some((c) => c.id === resultado.id) : false;

  return (
    <LayoutMobile cabecalho={<CabecalhoMobile titulo="Contatos" subtitulo="Busque pessoas pelo @" />}>
      <div className={estilos.busca}>
        <form onSubmit={procurar} role="search">
          <Campo
            id="busca-arroba"
            rotulo="Buscar por @"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="@usuario"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            erro={mensagem || undefined}
          />
          <Botao type="submit" expandido ocupado={buscando}>Buscar</Botao>
        </form>

        {resultado && (
          <ul className={estilos.lista} aria-label="Resultado da busca">
            <li className={estilos.cartao}>
              <span className={estilos.avatar} aria-hidden="true">{resultado.nome[0]}</span>
              <div className={estilos.dados}>
                <strong>{resultado.nome}</strong>
                <span>@{resultado.arroba}</span>
              </div>
              <Botao
                variante={jaAdicionado ? "secundaria" : "primaria"}
                disabled={jaAdicionado}
                onClick={() => aoAdicionar(resultado)}
              >
                {jaAdicionado ? "Adicionado" : "Adicionar"}
              </Botao>
            </li>
          </ul>
        )}
      </div>

      <section className={estilos.secao} aria-labelledby="titulo-meus-contatos">
        <h2 id="titulo-meus-contatos">Meus contatos</h2>
        {contatos.length === 0 ? (
          <p className={estilos.vazio}>Você ainda não adicionou ninguém.</p>
        ) : (
          <ul className={estilos.lista}>
            {contatos.map((contato) => (
              <li className={estilos.cartao} key={contato.id}>
                <span className={estilos.avatar} aria-hidden="true">{contato.nome[0]}</span>
                <div className={estilos.dados}>
                  <strong>{contato.nome}</strong>
                  <span>@{contato.arroba}</span>
                </div>
                <Botao
                  variante="perigo"
                  onClick={() => aoRemover(contato)}
                  aria-label={`Remover ${contato.nome} dos contatos`}
                >
                  Remover
                </Botao>
              </li>
            ))}
          </ul>
        )}
      </section>
    </LayoutMobile>
  );
}
