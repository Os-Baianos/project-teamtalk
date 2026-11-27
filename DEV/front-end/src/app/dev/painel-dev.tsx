"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Botao, Campo, CabecalhoMobile, LayoutMobile } from "@design/componentes";
import { editarUsuarioAction, excluirUsuarioAction, listarUsuariosAction, trocarSenhaAction } from "../../dev/acoes";
import type { UsuarioDev } from "../../dev/acoes";
import { Avatar } from "../../contatos/avatar";
import estilos from "./dev.module.css";

const data = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

export function PainelDev({ inicial, meuId }: { inicial: UsuarioDev[]; meuId: string }) {
  const [usuarios, setUsuarios] = useState(inicial);
  const [filtro, setFiltro] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [arroba, setArroba] = useState("");
  const [trocandoSenha, setTrocandoSenha] = useState<string | null>(null);
  const [novaSenha, setNovaSenha] = useState("");
  const [feito, setFeito] = useState("");
  const [saindo, setSaindo] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const visiveis = useMemo(() => {
    const t = filtro.trim().toLowerCase().replace(/^@/, "");
    if (!t) return usuarios;
    return usuarios.filter((u) => [u.nome, u.arroba, u.email].some((v) => v.toLowerCase().includes(t)));
  }, [usuarios, filtro]);

  async function recarregar() { setUsuarios(await listarUsuariosAction()); }

  function comecarEdicao(u: UsuarioDev) {
    setEditando(u.id); setExcluindo(null); setTrocandoSenha(null); setNome(u.nome); setArroba(u.arroba); setMensagem(""); setFeito("");
  }

  async function salvar(e: FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    setOcupado(true); setMensagem("");
    const r = await editarUsuarioAction(id, nome, arroba);
    setOcupado(false);
    if (!r.ok) { setMensagem(r.mensagem ?? "Não foi possível salvar."); return; }
    setEditando(null);
    await recarregar();
  }

  async function trocarSenha(e: FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    setOcupado(true); setMensagem(""); setFeito("");
    const r = await trocarSenhaAction(id, novaSenha);
    setOcupado(false);
    if (!r.ok) { setMensagem(r.mensagem ?? "Não foi possível trocar a senha."); return; }
    setTrocandoSenha(null); setNovaSenha("");
    setFeito("Senha trocada. A pessoa foi desconectada e entra com a nova senha.");
  }

  async function excluir(id: string) {
    setOcupado(true); setMensagem("");
    const r = await excluirUsuarioAction(id);
    setOcupado(false);
    if (!r.ok) { setMensagem(r.mensagem ?? "Não foi possível excluir."); return; }
    setExcluindo(null);
    setSaindo(id); // o cartão some com animação antes de sair da lista
    await new Promise((ok) => setTimeout(ok, 280));
    setSaindo(null);
    await recarregar();
  }

  return (
    <LayoutMobile cabecalho={<CabecalhoMobile titulo="Admin" subtitulo={`${usuarios.length} usuários cadastrados`} />}>
      <Campo id="filtro-usuarios" rotulo="Filtrar por nome, @ ou e-mail" value={filtro} onChange={(e) => setFiltro(e.target.value)} autoComplete="off" />
      {mensagem && <p className={estilos.erro} role="alert">{mensagem}</p>}
      {feito && <p className={estilos.ok} role="status">{feito}</p>}
      <ul className={estilos.lista} aria-label="Usuários">
        {visiveis.map((u) => (
          <li className={estilos.cartao} data-saindo={saindo === u.id} key={u.id}>
            {editando === u.id ? (
              <form className={`${estilos.edicao} ${estilos.painelInterno}`} onSubmit={(e) => salvar(e, u.id)}>
                <Campo id={`nome-${u.id}`} rotulo="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
                <Campo id={`arroba-${u.id}`} rotulo="Usuário (@)" value={arroba} onChange={(e) => setArroba(e.target.value)} autoCapitalize="none" spellCheck={false} />
                <div className={estilos.acoes}>
                  <Botao variante="secundaria" onClick={() => setEditando(null)} disabled={ocupado}>Cancelar</Botao>
                  <Botao type="submit" ocupado={ocupado}>Salvar</Botao>
                </div>
              </form>
            ) : trocandoSenha === u.id ? (
              <form className={`${estilos.edicao} ${estilos.painelInterno}`} onSubmit={(e) => trocarSenha(e, u.id)}>
                <Campo
                  id={`senha-${u.id}`}
                  rotulo={`Nova senha de ${u.nome}`}
                  type="password"
                  autoComplete="new-password"
                  ajuda="Mínimo 6 caracteres, com maiúscula, minúscula, número e símbolo."
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                />
                <div className={estilos.acoes}>
                  <Botao variante="secundaria" onClick={() => { setTrocandoSenha(null); setNovaSenha(""); setMensagem(""); }} disabled={ocupado}>Cancelar</Botao>
                  <Botao type="submit" ocupado={ocupado}>Trocar senha</Botao>
                </div>
              </form>
            ) : (
              <>
                <div className={estilos.pessoa}>
                  <Avatar nome={u.nome} fotoUrl={u.foto_url} />
                  <div className={estilos.dados}>
                    <strong>{u.nome} {u.papel === "dev" && <span className={estilos.papel}>ADMIN</span>}</strong>
                    <span>@{u.arroba}</span>
                    <span>{u.email}</span>
                    <span>Criada em {data(u.criado_em)}</span>
                  </div>
                </div>
                {excluindo === u.id ? (
                  <div className={`${estilos.acoes} ${estilos.painelInterno}`}>
                    <span className={estilos.aviso}>Excluir {u.nome}? Apaga a conta, os contatos e as mensagens. Não dá para desfazer.</span>
                    <Botao variante="secundaria" onClick={() => setExcluindo(null)} disabled={ocupado}>Cancelar</Botao>
                    <Botao variante="perigo" onClick={() => excluir(u.id)} ocupado={ocupado}>Confirmar exclusão</Botao>
                  </div>
                ) : (
                  <div className={estilos.acoes}>
                    <Botao variante="secundaria" onClick={() => comecarEdicao(u)}>Editar</Botao>
                    <Botao variante="secundaria" onClick={() => { setTrocandoSenha(u.id); setNovaSenha(""); setEditando(null); setExcluindo(null); setMensagem(""); setFeito(""); }} aria-label={`Trocar a senha de ${u.nome}`}>Trocar senha</Botao>
                    {u.id !== meuId && (
                      <Botao variante="perigo" onClick={() => { setExcluindo(u.id); setEditando(null); setMensagem(""); }} aria-label={`Excluir ${u.nome}`}>Excluir</Botao>
                    )}
                  </div>
                )}
              </>
            )}
          </li>
        ))}
        {visiveis.length === 0 && <li className={estilos.vazio}>Nenhum usuário encontrado.</li>}
      </ul>
    </LayoutMobile>
  );
}
