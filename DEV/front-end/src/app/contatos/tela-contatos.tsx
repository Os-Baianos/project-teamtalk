"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { FormEvent } from "react";
import { Campo, CabecalhoMobile, LayoutMobile } from "@design/componentes";
import { Avatar } from "../../contatos/avatar";
import { BotoesRelacao } from "../../contatos/botoes-relacao";
import type { Relacao } from "../../contatos/acoes";
import estilos from "./contatos.module.css";

export type Contato = { id: string; nome: string; arroba: string; foto_url?: string | null; relacao?: Relacao };

type Props = {
  /** Procura um usuário pelo @; devolve null quando não existe. */
  buscar: (arroba: string) => Promise<Contato | null>;
  /** Sugestões enquanto a pessoa digita (até 5). */
  sugerir?: (termo: string) => Promise<Contato[]>;
};

const normalizar = (valor: string) => valor.trim().replace(/^@/, "").toLowerCase();

export function TelaContatos({ buscar, sugerir }: Props) {
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
    if (pronta) { setSugestoes(pronta); return; }
    setErroSug("");
    const espera = setTimeout(async () => {
      try {
        // Tempo máximo de 8 s: o círculo nunca fica girando para sempre.
        const lista = await Promise.race([
          sugerir(q),
          new Promise<never>((_, rejeitar) => setTimeout(() => rejeitar(new Error("demorou")), 8000)),
        ]);
        guardadas.current.set(q, lista);
        if (numero === pedido.current) setSugestoes(lista);
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
    const parecidos = sugerir ? await sugerir(arroba) : [];
    if (parecidos.length) setSugestoes(parecidos);
    else setMensagem(`Nenhum usuário encontrado com @${arroba}.`);
  }

  return (
    <LayoutMobile cabecalho={<CabecalhoMobile titulo="Contatos" subtitulo="Envie uma solicitação para adicionar alguém" />}>
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
                    <Avatar nome={c.nome} fotoUrl={c.foto_url} />
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
                <Avatar nome={resultado.nome} fotoUrl={resultado.foto_url} />
                <div className={estilos.dados}>
                  <strong>{resultado.nome}</strong>
                  <span>@{resultado.arroba}</span>
                </div>
              </Link>
              <BotoesRelacao
                pessoa={resultado}
                relacao={resultado.relacao ?? "nenhuma"}
                aoMudar={(nova) => { guardadas.current.clear(); setResultado({ ...resultado, relacao: nova }); }}
              />
            </li>
          </ul>
        )}
      </div>

      <p className={estilos.atalho}>
        <Link href="/conta/contatos">Ver minhas solicitações e contatos</Link>
      </p>
    </LayoutMobile>
  );
}
