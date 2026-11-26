"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Botao, Campo, CabecalhoMobile, Carregando, LayoutMobile } from "@design/componentes";
import estilos from "./contatos.module.css";

export type Contato = { id: string; nome: string; arroba: string; foto_url?: string | null };

type Props = {
  /** Primeira carga de "Meus contatos" em andamento. */
  carregando?: boolean;
  contatos: Contato[];
  /** Procura um usuário pelo @; devolve null quando não existe. */
  buscar: (arroba: string) => Promise<Contato | null>;
  /** Sugestões enquanto a pessoa digita (até 5). */
  sugerir?: (termo: string) => Promise<Contato[]>;
  aoAdicionar: (contato: Contato) => void;
  aoRemover: (contato: Contato) => void;
};

const normalizar = (valor: string) => valor.trim().replace(/^@/, "").toLowerCase();

/** Foto de perfil; sem foto, mostra a inicial do nome. */
function Avatar({ contato }: { contato: Contato }) {
  return contato.foto_url
    ? <img className={`${estilos.avatar} ${estilos.avatarFoto}`} src={contato.foto_url} alt="" />
    : <Avatar contato={contato} />;
}

export function TelaContatos({ carregando = false, contatos, buscar, sugerir, aoAdicionar, aoRemover }: Props) {
  const [termo, setTermo] = useState("");
  const [resultado, setResultado] = useState<Contato | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [sugestoes, setSugestoes] = useState<Contato[]>([]);
  const [carregandoSug, setCarregandoSug] = useState(false);
  const pedido = useRef(0);

  // Sugestões: espera a pessoa parar de digitar um instante e ignora respostas antigas.
  useEffect(() => {
    const q = normalizar(termo);
    const numero = ++pedido.current;
    if (!sugerir || q.length < 2 || resultado) { setSugestoes([]); setCarregandoSug(false); return; }
    setCarregandoSug(true);
    const espera = setTimeout(async () => {
      const lista = await sugerir(q);
      if (numero === pedido.current) { setSugestoes(lista.filter((c) => !contatos.some((x) => x.id === c.id))); setCarregandoSug(false); }
    }, 250);
    return () => clearTimeout(espera);
  }, [termo, resultado]);

  function escolher(c: Contato) {
    setSugestoes([]);
    setMensagem("");
    setTermo(`@${c.arroba}`);
    setResultado(c);
  }

  async function procurar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const arroba = normalizar(termo);
    if (!arroba) return;
    setMensagem("");
    setResultado(null);
    const encontrado = await buscar(arroba);
    if (encontrado) { setResultado(encontrado); return; }
    // Sem @ exatamente igual: mostra as pessoas parecidas em vez de um erro.
    const parecidos = sugerir ? (await sugerir(arroba)).filter((c) => !contatos.some((x) => x.id === c.id)) : [];
    if (parecidos.length) setSugestoes(parecidos);
    else setMensagem(`Nenhum usuário encontrado com @${arroba}.`);
  }

  const jaAdicionado = resultado ? contatos.some((c) => c.id === resultado.id) : false;

  return (
    <LayoutMobile cabecalho={<CabecalhoMobile titulo="Contatos" subtitulo="Busque pessoas pelo nome ou @" />}>
      <div className={estilos.busca}>
        <form onSubmit={procurar} role="search">
          <Campo
            id="busca-arroba"
            rotulo="Buscar por nome ou @"
            value={termo}
            onChange={(e) => { setTermo(e.target.value); setResultado(null); setMensagem(""); }}
            placeholder="Nome ou @usuario"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            erro={mensagem || undefined}
          />
          {carregandoSug && sugestoes.length === 0 && <div className={estilos.sugCarregando}><Carregando tamanho="1.25rem" texto="Buscando sugestões" /></div>}
          {sugestoes.length > 0 && (
            <ul className={estilos.sugestoes} aria-label="Sugestões">
              {sugestoes.map((c) => (
                <li key={c.id}>
                  <button type="button" className={estilos.sugestao} onClick={() => escolher(c)}>
                    <Avatar contato={c} />
                    <span className={estilos.dados}>
                      <strong>{c.nome}</strong>
                      <span>@{c.arroba}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>

        {resultado && (
          <ul className={estilos.lista} aria-label="Resultado da busca">
            <li className={estilos.cartao}>
              <Avatar contato={resultado} />
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
        {carregando ? (
          <div className={estilos.carregando}><Carregando /></div>
        ) : contatos.length === 0 ? (
          <p className={estilos.vazio}>Você ainda não adicionou ninguém.</p>
        ) : (
          <ul className={estilos.lista}>
            {contatos.map((contato) => (
              <li className={estilos.cartao} key={contato.id}>
                <Avatar contato={contato} />
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
