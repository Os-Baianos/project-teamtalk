import Link from "next/link";
import { TelaLogin } from "@design/telas/login";

export default async function PaginaLogin({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const { aviso } = await searchParams;
  return (
    <>
      <TelaLogin mensagem="" aviso={aviso === "entre" ? "Entre para continuar." : ""} />
      <p className="rodape-auth">
        Ainda não tem conta? <Link href="/cadastro">Criar conta</Link>
      </p>
    </>
  );
}
