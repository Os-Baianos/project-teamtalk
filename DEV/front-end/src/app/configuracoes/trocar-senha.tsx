"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Aviso, Botao, Campo, ListaRegras } from "@design/componentes";
import { modoLista } from "@design/modo-lista";
import { regrasConfirmacao, regrasSenha, todasOk } from "../../design/validacoes";
import { trocarMinhaSenhaAction } from "../../configuracoes/acoes";
import estilos from "./configuracoes.module.css";

/** Linha "Senha": troca no mesmo lugar, pedindo a senha atual. */
export function TrocarSenha() {
  const [editando, setEditando] = useState(false);
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [focado, setFocado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [feito, setFeito] = useState(false);

  const regras = regrasSenha(nova);
  const confere = todasOk(regrasConfirmacao(nova, confirmacao));
  const pode = atual !== "" && todasOk(regras) && confere;

  function fechar() { setEditando(false); setAtual(""); setNova(""); setConfirmacao(""); setErro(""); }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!pode) return;
    setOcupado(true);
    setErro("");
    const r = await trocarMinhaSenhaAction(atual, nova);
    setOcupado(false);
    if (!r.ok) { setErro(r.mensagem ?? "Não foi possível trocar a senha."); return; }
    fechar();
    setFeito(true);
  }

  if (!editando) {
    return (
      <>
        <dd>Troque a senha de acesso à sua conta.</dd>
        {feito && <div className={estilos.avisoLinha}><Aviso aoFechar={() => setFeito(false)}>Senha alterada.</Aviso></div>}
        <div className={estilos.botaoCanto}><Botao onClick={() => { setFeito(false); setEditando(true); }}>Alterar</Botao></div>
      </>
    );
  }
  return (
    <form className={estilos.edicao} onSubmit={salvar} noValidate>
      <Campo id="senha-atual" rotulo="Senha atual" type="password" autoComplete="current-password" value={atual} onChange={(e) => setAtual(e.target.value)} />
      <div>
        <Campo id="senha-nova" rotulo="Nova senha" type="password" autoComplete="new-password" value={nova}
          onChange={(e) => setNova(e.target.value)} onFocus={() => setFocado(true)} onBlur={() => setFocado(false)} aria-describedby="regras-senha-nova" />
        <ListaRegras id="regras-senha-nova" regras={regras} modo={modoLista(nova, regras, false)} focado={focado} />
      </div>
      <Campo id="senha-confirmar" rotulo="Confirmar nova senha" type="password" autoComplete="new-password" value={confirmacao}
        onChange={(e) => setConfirmacao(e.target.value)} erro={confirmacao !== "" && !confere ? "As senhas não conferem." : undefined} />
      {erro && <p className={estilos.erro} role="alert">{erro}</p>}
      <div className={estilos.acoes}>
        <Botao type="submit" ocupado={ocupado} disabled={!pode}>Salvar</Botao>
        <Botao variante="discreta" disabled={ocupado} onClick={fechar}>Cancelar</Botao>
      </div>
    </form>
  );
}
