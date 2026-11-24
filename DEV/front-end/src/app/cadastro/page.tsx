import { TelaCadastro } from "./tela-cadastro";

// Ação provisória: o cadastro real é feito no card [BACK] Cadastro e login.
async function cadastrar() {
  "use server";
}

export default function PaginaCadastro() {
  return <TelaCadastro cadastrar={cadastrar} mensagem="" />;
}
