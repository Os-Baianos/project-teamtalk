import Link from "next/link";

type Props = { cadastrar: (dados: FormData) => Promise<void>; mensagem: string };

export function TelaCadastro({ cadastrar, mensagem }: Props) {
  return (
    <main className="pagina">
      <section className="painel" aria-labelledby="titulo-cadastro">
        <div className="marca" aria-label="TeamTalk">
          <span className="marca-simbolo" aria-hidden="true">T</span>
          <span>TeamTalk</span>
        </div>
        <h1 id="titulo-cadastro">Crie sua conta</h1>
        <p>Preencha os dados para começar a conversar com sua equipe.</p>
        <form action={cadastrar} className="formulario">
          <label htmlFor="nome">Nome completo</label>
          <input id="nome" name="nome" type="text" autoComplete="name" enterKeyHint="next" required />
          <label htmlFor="arroba">Usuário (@)</label>
          <input
            id="arroba"
            name="arroba"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            pattern="[a-z0-9_.]{3,20}"
            enterKeyHint="next"
            required
            aria-describedby="regra-arroba"
          />
          <p id="regra-arroba">De 3 a 20 caracteres: letras minúsculas, números, ponto ou _.</p>
          <label htmlFor="email">E-mail corporativo</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="email"
            enterKeyHint="next"
            required
          />
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            name="senha"
            type="password"
            autoComplete="new-password"
            minLength={10}
            maxLength={72}
            enterKeyHint="next"
            required
            aria-describedby="regra-senha"
          />
          <p id="regra-senha">Use pelo menos 10 caracteres.</p>
          <label htmlFor="confirmacao">Confirmar senha</label>
          <input
            id="confirmacao"
            name="confirmacao"
            type="password"
            autoComplete="new-password"
            minLength={10}
            maxLength={72}
            enterKeyHint="done"
            required
          />
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
