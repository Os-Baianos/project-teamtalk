import { redirect } from "next/navigation";
import { CabecalhoMobile, LayoutMobile } from "@design/componentes";
import { criarClienteServidor } from "../../supabase/servidor";
import { ExcluirConta } from "./excluir-conta";
import { Notificacoes } from "./notificacoes";
import { TrocarSenha } from "./trocar-senha";
import estilos from "./configuracoes.module.css";

export default async function PaginaConfiguracoes() {
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  return (
    <LayoutMobile cabecalho={<CabecalhoMobile titulo="Configurações" subtitulo="Notificações, senha e conta" />}>
      <dl className={estilos.lista}>
        <div className={estilos.linha}><dt>Notificações</dt><Notificacoes /></div>
        <div className={estilos.linha}><dt>Senha</dt><TrocarSenha /></div>
        <div className={estilos.linha}><dt>Excluir conta</dt><ExcluirConta /></div>
      </dl>
    </LayoutMobile>
  );
}
