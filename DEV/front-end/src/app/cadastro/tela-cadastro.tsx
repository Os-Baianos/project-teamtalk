"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { ListaRegras } from "@design/componentes";
import { modoLista } from "@design/modo-lista";
import {
  regrasArroba, regrasConfirmacao, regrasEmail, regrasNome, regrasSenha, todasOk,
} from "@design/validacoes";

type Props = { cadastrar: (dados: FormData) => Promise<void>; mensagem: string };
type Campo = "nome" | "arroba" | "email" | "senha" | "confirmacao";

export function TelaCadastro({ cadastrar, mensagem }: Props) {
  const [valores, setValores] = useState({ nome: "", arroba: "", email: "", senha: "", confirmacao: "" });
  const [focado, setFocado] = useState<Campo | null>(null);
  const [validados, setValidados] = useState<Record<Campo, boolean>>({
    nome: false, arroba: false, email: false, senha: false, confirmacao: false,
  });

  const regras = {
    nome: regrasNome(valores.nome),
    arroba: regrasArroba(valores.arroba),
    email: regrasEmail(valores.email),
    senha: regrasSenha(valores.senha),
    confirmacao: regrasConfirmacao(valores.senha, valores.confirmacao),
  };
  const modo = (campo: Campo) => modoLista(valores[campo], regras[campo], validados[campo]);
  const invalido = (campo: Campo) => validados[campo] && !todasOk(regras[campo]);

  const alterar = (campo: Campo, valor: string) => setValores((atual) => ({ ...atual, [campo]: valor }));
  const aoSair = (campo: Campo) => {
    setFocado(null);
    if (valores[campo] !== "") setValidados((atual) => ({ ...atual, [campo]: true }));
  };

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    if (!todasOk(...Object.values(regras))) {
      evento.preventDefault();
      setValidados({ nome: true, arroba: true, email: true, senha: true, confirmacao: true });
    }
  }

  const campo = (
    id: Campo, rotulo: string, props: React.InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <>
      <label htmlFor={id}>{rotulo}</label>
      <input
        id={id}
        name={id}
        value={valores[id]}
        onChange={(e) => alterar(id, e.target.value)}
        onFocus={() => setFocado(id)}
        onBlur={() => aoSair(id)}
        aria-invalid={invalido(id)}
        aria-describedby={`regras-${id}`}
        required
        {...props}
      />
      <ListaRegras id={`regras-${id}`} regras={regras[id]} modo={modo(id)} focado={focado === id} />
    </>
  );

  return (
    <main className="pagina">
      <section className="painel" aria-labelledby="titulo-cadastro">
        <div className="marca" aria-label="TeamTalk">
          <span className="marca-simbolo" aria-hidden="true">T</span>
          <span>TeamTalk</span>
        </div>
        <h1 id="titulo-cadastro">Crie sua conta</h1>
        <p>Preencha os dados para começar a conversar com sua equipe.</p>
        <form action={cadastrar} onSubmit={aoEnviar} className="formulario" noValidate>
          {campo("nome", "Nome completo", { type: "text", autoComplete: "name", enterKeyHint: "next" })}
          {campo("arroba", "Usuário (@)", {
            type: "text", autoComplete: "username", autoCapitalize: "none", spellCheck: false,
            maxLength: 30, enterKeyHint: "next",
          })}
          {campo("email", "E-mail corporativo", {
            type: "email", autoComplete: "email", autoCapitalize: "none", spellCheck: false,
            inputMode: "email", enterKeyHint: "next",
          })}
          {campo("senha", "Senha", {
            type: "password", autoComplete: "new-password", maxLength: 100, enterKeyHint: "next",
          })}
          {campo("confirmacao", "Confirmar senha", {
            type: "password", autoComplete: "new-password", maxLength: 100, enterKeyHint: "done",
          })}
          {mensagem && <p className="erro" role="alert">{mensagem}</p>}
          <button type="submit">Criar conta</button>
        </form>
        <p className="rodape-auth">
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
      </section>
    </main>
  );
}
