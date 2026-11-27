"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Botao, Campo } from "@design/componentes";
import { Icone } from "@design/icones/icone";
import { Avatar } from "../contatos/avatar";
import { listarUsuariosAction } from "../dev/acoes";
import { adicionarMembrosAction, configurarGrupoAction, excluirGrupoAction, removerMembroAction, sairDoGrupoAction } from "./acoes";
import { definirFotoGrupo } from "./leituras";
import { SeletorPessoas } from "./seletor-pessoas";
import type { PessoaEscolha } from "./seletor-pessoas";
import type { GrupoResumo, MembroGrupo } from "./tipos";
import estilos from "./grupos.module.css";

type Props = {
  grupo: GrupoResumo;
  membros: MembroGrupo[];
  meuId: string;
  /** Admin/DEV: pode mudar tudo. */
  souAdmin: boolean;
  aoFechar: () => void;
  /** Algo mudou: recarrega o grupo. */
  aoMudar: () => void;
  /** Saí ou o grupo foi excluído. */
  aoSair: () => void;
};

/** Informações do grupo (como no WhatsApp): foto, nome, regra do chat, membros e saída. */
export function InfoGrupo({ grupo, membros, meuId, souAdmin, aoFechar, aoMudar, aoSair }: Props) {
  const [nome, setNome] = useState(grupo.nome);
  const [editandoNome, setEditandoNome] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [candidatos, setCandidatos] = useState<PessoaEscolha[]>([]);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const arquivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fechar = (e: KeyboardEvent) => { if (e.key === "Escape") aoFechar(); };
    document.addEventListener("keydown", fechar);
    return () => document.removeEventListener("keydown", fechar);
  }, [aoFechar]);

  const idsMembros = useMemo(() => new Set(membros.map((m) => m.id)), [membros]);

  async function executar(fazer: () => Promise<{ ok: boolean; mensagem?: string }>, depois?: () => void) {
    setOcupado(true); setErro("");
    const r = await fazer();
    setOcupado(false);
    if (!r.ok) { setErro(r.mensagem ?? "Não foi possível concluir."); return false; }
    (depois ?? aoMudar)();
    return true;
  }

  async function salvarNome(e: FormEvent) {
    e.preventDefault();
    if (nome.trim() === grupo.nome) { setEditandoNome(false); return; }
    if (await executar(() => configurarGrupoAction(grupo.id, nome, grupo.so_admins))) setEditandoNome(false);
  }

  async function abrirAdicionar() {
    setAdicionando(true); setMarcados(new Set()); setErro("");
    const todos = await listarUsuariosAction();
    setCandidatos(todos.map((u) => ({ id: u.id, nome: u.nome, arroba: u.arroba, foto_url: u.foto_url })));
  }

  async function trocarFoto(f: File | undefined) {
    if (!f) return;
    setOcupado(true); setErro("");
    const falha = await definirFotoGrupo(grupo.id, f, meuId);
    setOcupado(false);
    if (falha) setErro(falha); else aoMudar();
  }

  async function tirarFoto() {
    setOcupado(true); setErro("");
    const falha = await definirFotoGrupo(grupo.id, null, meuId);
    setOcupado(false);
    if (falha) setErro(falha); else aoMudar();
  }

  return (
    <div className={estilos.fundo} onMouseDown={aoFechar}>
      <div className={estilos.painel} role="dialog" aria-modal="true" aria-label="Informações do grupo" onMouseDown={(e) => e.stopPropagation()}>
        <header className={estilos.painelTopo}>
          <h2>Informações do grupo</h2>
          <Botao variante="discreta" onClick={aoFechar} aria-label="Fechar"><Icone nome="fechar" width={18} height={18} /></Botao>
        </header>

        <section className={estilos.identidade}>
          <span className={estilos.foto}><Avatar nome={grupo.nome} fotoUrl={grupo.foto_url} /></span>
          {editandoNome ? (
            <form className={estilos.secao} onSubmit={salvarNome}>
              <Campo id="nome-grupo" rotulo="Nome do grupo" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={60} autoFocus />
              <div className={estilos.acoes}>
                <Botao variante="secundaria" onClick={() => { setEditandoNome(false); setNome(grupo.nome); }} disabled={ocupado}>Cancelar</Botao>
                <Botao type="submit" ocupado={ocupado}>Salvar</Botao>
              </div>
            </form>
          ) : (
            <>
              <strong>{grupo.nome}</strong>
              <span>{membros.length} membro{membros.length === 1 ? "" : "s"}</span>
            </>
          )}
          {souAdmin && !editandoNome && (
            <div className={estilos.acoes}>
              <input ref={arquivo} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => { void trocarFoto(e.target.files?.[0]); e.target.value = ""; }} />
              <Botao variante="secundaria" onClick={() => setEditandoNome(true)} disabled={ocupado}>Editar nome</Botao>
              <Botao variante="secundaria" onClick={() => arquivo.current?.click()} disabled={ocupado}>Trocar foto</Botao>
              {grupo.foto_url && <Botao variante="secundaria" onClick={tirarFoto} disabled={ocupado}>Remover foto</Botao>}
            </div>
          )}
        </section>

        {souAdmin ? (
          <label className={estilos.interruptor}>
            <input type="checkbox" checked={grupo.so_admins} disabled={ocupado} onChange={(e) => void executar(() => configurarGrupoAction(grupo.id, grupo.nome, e.target.checked))} />
            <span>Somente admins podem enviar mensagens</span>
          </label>
        ) : (
          <p className={estilos.contagem}>{grupo.so_admins ? "Somente admins podem enviar mensagens." : "Todos os membros podem enviar mensagens."}</p>
        )}

        <section className={estilos.secao}>
          <h3>Membros</h3>
          {adicionando ? (
            <>
              <SeletorPessoas id="adicionar-membros" pessoas={candidatos.filter((c) => !idsMembros.has(c.id))} marcados={marcados}
                aoAlternar={(id) => setMarcados((a) => { const n = new Set(a); if (n.has(id)) n.delete(id); else n.add(id); return n; })} vazio="Todos já estão no grupo." />
              <div className={estilos.acoes}>
                <Botao variante="secundaria" onClick={() => setAdicionando(false)} disabled={ocupado}>Cancelar</Botao>
                <Botao ocupado={ocupado} disabled={marcados.size === 0} onClick={async () => { if (await executar(() => adicionarMembrosAction(grupo.id, [...marcados]))) setAdicionando(false); }}>Adicionar</Botao>
              </div>
            </>
          ) : (
            <>
              {souAdmin && <Botao variante="secundaria" onClick={abrirAdicionar} disabled={ocupado}>Adicionar membros</Botao>}
              <ul className={estilos.membros}>
                {membros.map((m) => (
                  <li key={m.id} className={estilos.membro}>
                    <Avatar nome={m.nome} fotoUrl={m.foto_url} />
                    <span className={estilos.nomes}>
                      <strong>{m.nome}{m.id === meuId && " (você)"} {m.admin && <span className={estilos.papel}>ADMIN</span>}</strong>
                      <span>@{m.arroba}</span>
                    </span>
                    {souAdmin && m.id !== meuId && (
                      <Botao variante="discreta" disabled={ocupado} onClick={() => { if (window.confirm(`Remover ${m.nome} do grupo?`)) void executar(() => removerMembroAction(grupo.id, m.id)); }}>Remover</Botao>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {erro && <p className={estilos.erro} role="alert">{erro}</p>}

        <div className={estilos.acoes}>
          <Botao variante="perigo" disabled={ocupado} onClick={() => { if (window.confirm("Sair deste grupo? Você perde o acesso às mensagens.")) void executar(() => sairDoGrupoAction(grupo.id), aoSair); }}>Sair do grupo</Botao>
          {souAdmin && <Botao variante="perigo" disabled={ocupado} onClick={() => { if (window.confirm("Excluir o grupo e todas as mensagens? Não dá para desfazer.")) void executar(() => excluirGrupoAction(grupo.id), aoSair); }}>Excluir grupo</Botao>}
        </div>
      </div>
    </div>
  );
}
