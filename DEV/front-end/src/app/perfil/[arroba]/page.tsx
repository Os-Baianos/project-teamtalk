import { notFound, redirect } from "next/navigation";
import { CabecalhoMobile, LayoutMobile } from "@design/componentes";
import { criarClienteServidor } from "../../../supabase/servidor";
import { AcoesPerfil } from "./acoes-perfil";
import estilos from "../perfil.module.css";

/** Perfil de outra pessoa: só para ver (sem e-mail). O próprio perfil continua em /perfil. */
export default async function PaginaPerfilDeOutraPessoa({ params }: { params: Promise<{ arroba: string }> }) {
  const { arroba } = await params;
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data } = await supabase.rpc("ver_perfil", { candidato: decodeURIComponent(arroba) });
  const perfil = data?.[0];
  if (!perfil) notFound();
  if (perfil.id === auth.user.id) redirect("/perfil");

  const fotoUrl = perfil.foto_path ? supabase.storage.from("avatares").getPublicUrl(perfil.foto_path).data.publicUrl : null;
  const desde = new Date(perfil.criado_em).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

  return (
    <LayoutMobile cabecalho={<CabecalhoMobile titulo="Perfil" subtitulo={`@${perfil.arroba}`} />}>
      <div className={estilos.topo}>
        {fotoUrl
          ? <img className={estilos.foto} src={fotoUrl} alt="" />
          : <span className={estilos.foto} aria-hidden="true">{perfil.nome[0]?.toUpperCase()}</span>}
        <h2 className={estilos.nome}>{perfil.nome}</h2>
        <p className={estilos.arroba}>@{perfil.arroba}</p>
        <AcoesPerfil id={perfil.id} arroba={perfil.arroba} relacao={perfil.relacao} />
      </div>
      <dl className={estilos.lista}>
        <div className={estilos.linha}><dt>Nome</dt><dd>{perfil.nome}</dd></div>
        <div className={estilos.linha}><dt>Usuário (@)</dt><dd>@{perfil.arroba}</dd></div>
        <div className={estilos.linha}><dt>Conta criada em</dt><dd>{desde}</dd></div>
      </dl>
    </LayoutMobile>
  );
}
