import { redirect } from "next/navigation";
import { CabecalhoMobile, LayoutMobile } from "@design/componentes";
import { criarClienteServidor } from "../../supabase/servidor";
import { FotoPerfil } from "./foto-perfil";
import estilos from "./perfil.module.css";

export default async function PaginaPerfil() {
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome, arroba, criado_em, foto_path")
    .eq("id", auth.user.id)
    .single();

  const nome = perfil?.nome ?? "Sem nome";
  const desde = perfil?.criado_em
    ? new Date(perfil.criado_em).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : "—";

  const fotoPath = perfil?.foto_path ?? null;
  const fotoUrl = fotoPath ? supabase.storage.from("avatares").getPublicUrl(fotoPath).data.publicUrl : null;

  return (
    <LayoutMobile cabecalho={<CabecalhoMobile titulo="Perfil" subtitulo="Seus dados no TeamTalk" />}>
      <div className={estilos.topo}>
        <FotoPerfil usuarioId={auth.user.id} inicial={nome[0]?.toUpperCase() ?? "?"} fotoUrl={fotoUrl} fotoPath={fotoPath} />
        <h2 className={estilos.nome}>{nome}</h2>
        <p className={estilos.arroba}>@{perfil?.arroba}</p>
      </div>
      <dl className={estilos.lista}>
        <div className={estilos.linha}><dt>Nome</dt><dd>{nome}</dd></div>
        <div className={estilos.linha}><dt>Usuário (@)</dt><dd>@{perfil?.arroba}</dd></div>
        <div className={estilos.linha}><dt>E-mail</dt><dd>{auth.user.email}</dd></div>
        <div className={estilos.linha}><dt>Conta criada em</dt><dd>{desde}</dd></div>
      </dl>
    </LayoutMobile>
  );
}
