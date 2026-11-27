"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Botao, Campo, CabecalhoMobile, LayoutMobile, MenuAcoes } from "@design/componentes";
import type { ItemMenuAcoes } from "@design/componentes";
import { editarUsuarioAction, excluirUsuarioAction, liberarTrocaArrobaAction, listarUsuariosAction, trocarSenhaAction } from "../../dev/acoes";
import type { UsuarioDev } from "../../dev/acoes";
import { Avatar } from "../../contatos/avatar";
import estilos from "./dev.module.css";

const DIAS_30 = 30 * 24 * 60 * 60 * 1000;
/** A pessoa trocou o @ há menos de 30 dias e ainda está esperando. */
const esperando = (u: UsuarioDev) => !!u.arroba_alterado_em && new Date(u.arroba_alterado_em).getTime() + DIAS_30 > Date.now();
const data = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

function DadosUsuario({ u }: { u: UsuarioDev }) {
  return (
    <div className={estilos.dados}>
      <strong>{u.nome} {u.papel === "dev" && <span className={estilos.papel}>ADMIN</span>}</strong>
      <span>@{u.arroba} · {u.email}</span>
      <span className={estilos.data}>Criada em {data(u.criado_em)}</span>
      {esperando(u) && <span className={estilos.data}>Trocou o @ em {data(u.arroba_alterado_em!)} · pode trocar de novo em {data(new Date(new Date(u.arroba_alterado_em!).getTime() + DIAS_30).toISOString())}</span>}
    </div>
  );
}

export function PainelDev({ inicial, meuId }: { inicial: UsuarioDev[]; meuId: string }) {
  const [usuarios, setUsuarios] = useState(inicial);
  const [filtro, setFiltro] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
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
    setEditando(u.id); setTrocandoSenha(null); setNome(u.nome); setArroba(u.arroba); setMensagem(""); setFeito("");
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
  }

  async function excluir(id: string): Promise<string | null> {
    const r = await excluirUsuarioAction(id);
    if (!r.ok) return r.mensagem ?? "Não foi possível excluir.";
    setSaindo(id); // o cartão some com animação antes de sair da lista
    await new Promise((ok) => setTimeout(ok, 280));
    setSaindo(null);
    await recarregar();
    return null;
  }

  function itensDe(u: UsuarioDev): ItemMenuAcoes[] {
    const itens: ItemMenuAcoes[] = [
      { id: "editar", rotulo: "Editar", aoEscolher: async () => { comecarEdicao(u); return null; } },
      { id: "senha", rotulo: "Trocar senha", aoEscolher: async () => { setTrocandoSenha(u.id); setNovaSenha(""); setEditando(null); setMensagem(""); setFeito(""); return null; } },
    ];
    if (esperando(u)) {
      itens.push({ id: "liberar", rotulo: "Liberar troca de @", aoEscolher: async () => {
        const r = await liberarTrocaArrobaAction(u.id);
        if (!r.ok) return r.mensagem ?? "Não foi possível liberar.";
        setFeito(`Troca de @ liberada para ${u.nome}.`); setMensagem("");
        await recarregar();
        return null;
      } });
    }
    if (u.id !== meuId) {
      itens.push({ id: "excluir", rotulo: "Excluir", perigo: true, confirmacao: `Excluir ${u.nome}? Apaga a conta, os contatos e as mensagens. Não dá para desfazer.`, aoEscolher: () => excluir(u.id) });
    }
    return itens;
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
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                />
                <div className={estilos.acoes}>
                  <Botao variante="secundaria" onClick={() => { setTrocandoSenha(null); setNovaSenha(""); setMensagem(""); }} disabled={ocupado}>Cancelar</Botao>
                  <Botao type="submit" ocupado={ocupado}>Trocar senha</Botao>
                </div>
              </form>
            ) : (
              <div className={estilos.topo}>
                {u.id === meuId ? (
                  <div className={estilos.pessoa}>
                    <Avatar nome={u.nome} fotoUrl={u.foto_url} />
                    <DadosUsuario u={u} />
                  </div>
                ) : (
                  <Link className={`${estilos.pessoa} ${estilos.pessoaLink}`} href={`/perfil/${u.arroba}`}>
                    <Avatar nome={u.nome} fotoUrl={u.foto_url} />
                    <DadosUsuario u={u} />
                  </Link>
                )}
                <MenuAcoes itens={itensDe(u)} rotulo={`Mais ações de ${u.nome}`} />
              </div>
            )}
          </li>
        ))}
        {visiveis.length === 0 && <li className={estilos.vazio}>Nenhum usuário encontrado.</li>}
      </ul>
    </LayoutMobile>
  );
}
