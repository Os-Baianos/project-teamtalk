"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Aviso, Botao, Campo } from "@design/componentes";
import { limparCache } from "../../cache/cache-local";
import { guardarEndpoint } from "../../push/cliente";
import { excluirMinhaContaAction } from "../../configuracoes/acoes";
import estilos from "./configuracoes.module.css";

/** Linha "Excluir conta": pede a senha e avisa que não dá para desfazer. */
export function ExcluirConta() {
  const [aberto, setAberto] = useState(false);
  const [senha, setSenha] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  function fechar() { setAberto(false); setSenha(""); setErro(""); }

  async function confirmar(e: FormEvent) {
    e.preventDefault();
    if (!senha) return;
    setOcupado(true);
    setErro("");
    const r = await excluirMinhaContaAction(senha);
    if (!r.ok) { setOcupado(false); setErro(r.mensagem ?? "Não foi possível excluir."); return; }
    limparCache();
    guardarEndpoint(null);
    window.location.assign("/login");
  }

  if (!aberto) {
    return (
      <>
        <dd>Apaga sua conta, seus contatos e suas mensagens.</dd>
        <div className={estilos.botaoCanto}><Botao onClick={() => setAberto(true)}>Excluir</Botao></div>
      </>
    );
  }
  return (
    <form className={estilos.edicao} onSubmit={confirmar} noValidate>
      <Aviso>Isso não dá para desfazer: sua conta, seus contatos e as suas mensagens serão apagados.</Aviso>
      <Campo id="senha-excluir" rotulo="Digite sua senha para confirmar" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
      {erro && <p className={estilos.erro} role="alert">{erro}</p>}
      <div className={estilos.acoes}>
        <Botao type="submit" ocupado={ocupado} disabled={!senha}>Excluir minha conta</Botao>
        <Botao variante="discreta" disabled={ocupado} onClick={fechar}>Cancelar</Botao>
      </div>
    </form>
  );
}
