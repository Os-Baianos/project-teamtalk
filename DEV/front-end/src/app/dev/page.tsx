import { redirect } from "next/navigation";
import { criarClienteServidor } from "../../supabase/servidor";
import { listarUsuariosAction } from "../../dev/acoes";
import { PainelDev } from "./painel-dev";

export default async function PaginaDev() {
  const supabase = await criarClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  const { data: dev } = await supabase.rpc("sou_dev");
  if (dev !== true) redirect("/conversas");
  const usuarios = await listarUsuariosAction();
  return <PainelDev inicial={usuarios} meuId={auth.user.id} />;
}
