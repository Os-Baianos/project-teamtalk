"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { ListaRegras } from "@design/componentes";
import { regrasEmail, todasOk } from "@design/validacoes";

type Props = { entrar: (dados: FormData) => Promise<void>; mensagem: string; aviso: string };

export function TelaLogin({ entrar, mensagem, aviso }: Props) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [tocados, setTocados] = useState({ usuario: false, senha: false });

  const regrasUsuario = regrasEmail(usuario);
  const regrasSenha = [{ texto: "Informe a senha", ok: senha.length > 0 }];
  const usuarioInvalido = tocados.usuario && !todasOk(regrasUsuario);
  const senhaInvalida = tocados.senha && !todasOk(regrasSenha);

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    if (!todasOk(regrasUsuario, regrasSenha)) {
      evento.preventDefault();
      setTocados({ usuario: true, senha: true });
    }
  }

  return (
    <main className="pagina">
      <section className="painel" aria-labelledby="titulo-login">
        <div className="marca" aria-label="TeamTalk">
          <span className="marca-simbolo" aria-hidden="true">T</span>
          <span>TeamTalk</span>
        </div>
        <h1 id="titulo-login">Acesse sua conta</h1>
        <p>Entre com suas credenciais corporativas autorizadas.</p>
        {aviso && <p role="status">{aviso}</p>}
        <form action={entrar} onSubmit={aoEnviar} className="formulario" noValidate>
          <label htmlFor="usuario">E-mail corporativo</label>
          <input
            id="usuario"
            name="usuario"
            type="email"
            value={usuario}
            onChange={(e) => { setUsuario(e.target.value); setTocados((t) => ({ ...t, usuario: true })); }}
            onBlur={() => setTocados((t) => ({ ...t, usuario: true }))}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="email"
            enterKeyHint="next"
            required
            aria-invalid={usuarioInvalido || !!mensagem}
            aria-describedby="regras-usuario"
          />
          <ListaRegras id="regras-usuario" regras={regrasUsuario} ativa={tocados.usuario} />
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            name="senha"
            type="password"
            value={senha}
            onChange={(e) => { setSenha(e.target.value); setTocados((t) => ({ ...t, senha: true })); }}
            onBlur={() => setTocados((t) => ({ ...t, senha: true }))}
            autoComplete="current-password"
            enterKeyHint="go"
            required
            aria-describedby={mensagem ? "regras-senha erro-login" : "regras-senha"}
            aria-invalid={senhaInvalida || !!mensagem}
          />
          <ListaRegras id="regras-senha" regras={regrasSenha} ativa={tocados.senha} />
          {mensagem && <p className="erro" id="erro-login" role="alert">{mensagem}</p>}
          <button type="submit">Entrar</button>
        </form>
      </section>
    </main>
  );
}
