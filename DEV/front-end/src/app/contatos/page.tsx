"use client";

import { TelaContatos } from "./tela-contatos";
import { buscarPerfilAction, sugerirPerfisAction } from "../../contatos/acoes";

export default function PaginaContatos() {
  return <TelaContatos buscar={buscarPerfilAction} sugerir={sugerirPerfisAction} />;
}
