import Link from "next/link";
import { TelaLogin } from "@design/telas/login";

// Ação provisória: a autenticação real é feita no card [BACK] Cadastro e login.
async function entrar() {
  "use server";
}

export default function PaginaLogin() {
  return (
    <>
      <TelaLogin entrar={entrar} mensagem="" aviso="" />
      <p className="rodape-auth">
        Ainda não tem conta? <Link href="/cadastro">Criar conta</Link>
      </p>
    </>
  );
}
