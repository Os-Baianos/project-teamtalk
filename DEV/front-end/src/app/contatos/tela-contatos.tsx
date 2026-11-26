"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { FormEvent } from "react";
import { Botao, Campo, CabecalhoMobile, LayoutMobile } from "@design/componentes";
import estilos from "./contatos.module.css";

export type Contato = { id: string; nome: string; arroba: string; foto_url?: string | null };

type Props = {
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
    : <span className={estilos.avatar} aria-hidden="true">{contato.nome[0]}</span>;
}

export function TelaContatos({ contatos, buscar, sugerir, aoAdicionar, aoRemover }: Props) {
  const [termo, setTermo] = useState("");
  const [resultado, setResultado] = useState<Contato | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [sugestoes, setSugestoes] = useState<Contato[]>([]);
  const [erroSug, setErroSug] = useState("");
  const pedido = useRef(0);
  const guardadas = useRef(new Map<string, Contato[]>()); // respostas já buscadas (apagar letra volta na hora)

  // Sugestões: espera a pessoa parar de digitar um instante e ignora respostas antigas.
  useEffect(() => {
    const q = normalizar(termo);
    const numero = ++pedido.current;
    if (!sugerir || q.length < 2 || resultado) { setSugestoes([]); setErroSug(""); return; }
    const pronta = guardadas.current.get(q);
    if (pronta) { setSugestoes(pronta.filter((c) => !contatos.some((x) => x.id === c.id))); return; }
    setErroSug("");
    const espera = setTimeout(async () => {
      try {
        // Tempo máximo de 8 s: o círculo nunca fica girando para sempre.
        const lista = await Promise.race([
          sugerir(q),
          new Promise<never>((_, rejeitar) => setTimeout(() => rejeitar(new Error("demorou")), 8000)),
        ]);
        guardadas.current.set(q, lista);
        if (numero === pedido.current) setSugestoes(lista.filter((c) => !contatos.some((x) => x.id === c.id)));
      } catch {
        if (numero !== pedido.current) return;
        // Página aberta antes de uma atualização do site: recarrega uma vez para pegar a versão nova.
        try {
          const ultima = Number(sessionStorage.getItem("recarregou-em") ?? 0);
          if (Date.now() - ultima > 60_000) { sessionStorage.setItem("recarregou-em", String(Date.now())); location.reload(); return; }
        } catch { /* sem sessionStorage: só mostra o aviso */ }
        setErroSug("Não foi possível buscar agora. Atualize a página.");
      }
    }, 180);
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
    <LayoutMobile cabecalho={<CabecalhoMobile titulo="Contatos" subtitulo="Adicione pessoas à sua lista" />}>
      <div className={estilos.busca}>
        <form onSubmit={procurar} role="search">
          <Campo
            id="busca-arroba"
            rotulo="Buscar pessoa"
            value={termo}
            onChange={(e) => { setTermo(e.target.value); setResultado(null); setMensagem(""); }}
            placeholder="@usuario"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            erro={mensagem || undefined}
          />
          {erroSug && <p className={estilos.erroSug} role="alert">{erroSug}</p>}
          {sugestoes.length > 0 && (
            <ul className={estilos.sugestoes} aria-label="Sugestões">
              {sugestoes.map((c) => (
                <li key={c.id} className={estilos.sugestaoLinha}>
                  <button type="button" className={estilos.sugestao} onClick={() => escolher(c)}>
                    <Avatar contato={c} />
                    <span className={estilos.dados}>
                      <strong>{c.nome}</strong>
                      <span>@{c.arroba}</span>
                    </span>
                  </button>
                  <Link className={estilos.verPerfil} href={`/perfil/${c.arroba}`}>Ver perfil</Link>
                </li>
              ))}
            </ul>
          )}
        </form>

        {resultado && (
          <ul className={estilos.lista} aria-label="Resultado da busca">
            <li className={estilos.cartao}>
              <Link className={estilos.perfilLink} href={`/perfil/${resultado.arroba}`} aria-label={`Ver o perfil de ${resultado.nome}`}>
                <Avatar contato={resultado} />
                <div className={estilos.dados}>
                  <strong>{resultado.nome}</strong>
                  <span>@{resultado.arroba}</span>
                </div>
              </Link>
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
                <Link className={estilos.perfilLink} href={`/perfil/${contato.arroba}`} aria-label={`Ver o perfil de ${contato.nome}`}>
                  <Avatar contato={contato} />
                  <div className={estilos.dados}>
                    <strong>{contato.nome}</strong>
                    <span>@{contato.arroba}</span>
                  </div>
                </Link>
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
