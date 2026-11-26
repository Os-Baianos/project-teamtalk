"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { ListaRegras } from "@design/componentes";
import { modoLista } from "@design/modo-lista";
import { regrasEmail, todasOk } from "@design/validacoes";
import { entrarAction } from "../../sessao/acoes";

type Props = { mensagem: string; aviso: string };

export function TelaLogin({ mensagem: mensagemInicial, aviso }: Props) {
  const roteador = useRouter();
  const [mensagem, setMensagem] = useState(mensagemInicial);
  const [avisoAberto, setAvisoAberto] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [focado, setFocado] = useState<"usuario" | "senha" | null>(null);
  const [validados, setValidados] = useState({ usuario: false, senha: false });

  const regrasUsuario = regrasEmail(usuario);
  const regrasSenha = [{ texto: "Informe a senha", ok: senha.length > 0 }];
  const usuarioInvalido = validados.usuario && !todasOk(regrasUsuario);
  const senhaInvalida = validados.senha && !todasOk(regrasSenha);

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!todasOk(regrasUsuario, regrasSenha)) {
      setValidados({ usuario: true, senha: true });
      return;
    }
    setEnviando(true);
    entrarAction(usuario, senha)
      .then((resultado) => {
        if (resultado.ok) {
          setMensagem("");
          roteador.push("/contatos");
          roteador.refresh();
        } else {
          setMensagem(resultado.mensagem);
          setEnviando(false);
        }
      })
      .catch(() => {
        setMensagem("Não foi possível entrar agora. Tente novamente.");
        setEnviando(false);
      });
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
        {aviso && avisoAberto && (
          <p role="status">
            <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
              <circle cx="10" cy="10" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <rect x="9.1" y="8.5" width="1.8" height="5.5" rx=".9" fill="currentColor" />
              <circle cx="10" cy="6" r="1.1" fill="currentColor" />
            </svg>
            <span>{aviso}</span>
            <button type="button" className="aviso-fechar" aria-label="Fechar aviso" onClick={() => setAvisoAberto(false)}>
              <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
                <path d="M4.5 4.5l11 11M15.5 4.5l-11 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              </svg>
            </button>
          </p>
        )}
        <form onSubmit={aoEnviar} className="formulario" noValidate>
          <label htmlFor="usuario">E-mail corporativo</label>
          <input
            id="usuario"
            name="usuario"
            type="email"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            onFocus={() => setFocado("usuario")}
            onBlur={() => { setFocado(null); if (usuario !== "") setValidados((v) => ({ ...v, usuario: true })); }}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="email"
            enterKeyHint="next"
            required
            aria-invalid={usuarioInvalido || !!mensagem}
            aria-describedby="regras-usuario"
          />
          <ListaRegras id="regras-usuario" regras={regrasUsuario} modo={modoLista(usuario, regrasUsuario, validados.usuario)} focado={focado === "usuario"} />
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            name="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onFocus={() => setFocado("senha")}
            onBlur={() => { setFocado(null); if (senha !== "") setValidados((v) => ({ ...v, senha: true })); }}
            autoComplete="current-password"
            enterKeyHint="go"
            required
            aria-describedby={mensagem ? "regras-senha erro-login" : "regras-senha"}
            aria-invalid={senhaInvalida || !!mensagem}
          />
          <ListaRegras id="regras-senha" regras={regrasSenha} modo={senhaInvalida ? "pendentes" : "oculta"} focado={focado === "senha"} />
          {mensagem && <p className="erro" id="erro-login" role="alert">{mensagem}</p>}
          <button type="submit" disabled={enviando} aria-busy={enviando}>{enviando ? "Entrando..." : "Entrar"}</button>
        </form>
      </section>
    </main>
  );
}
