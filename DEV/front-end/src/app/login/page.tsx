import Link from "next/link";
import { TelaLogin } from "@design/telas/login";

export default function PaginaLogin() {
  return (
    <>
      <TelaLogin mensagem="" aviso="" />
      <p className="rodape-auth">
        Ainda não tem conta? <Link href="/cadastro">Criar conta</Link>
      </p>
    </>
  );
}
