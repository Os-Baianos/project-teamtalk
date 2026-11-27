"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Botao, Campo, MenuAcoes } from "@design/componentes";
import { Avatar } from "../../contatos/avatar";
import { criarGrupoAction, excluirGrupoAction } from "../../grupos/acoes";
import { lerTodosGrupos } from "../../grupos/leituras";
import { SeletorPessoas } from "../../grupos/seletor-pessoas";
import type { GrupoAdmin } from "../../grupos/tipos";
import type { UsuarioDev } from "../../dev/acoes";
import grupos from "../../grupos/grupos.module.css";
import estilos from "./dev.module.css";

/** Seção do painel Admin: criar comunidades e ver/excluir as que existem. */
export function ComunidadesDev({ usuarios, meuId }: { usuarios: UsuarioDev[]; meuId: string }) {
  const [lista, setLista] = useState<GrupoAdmin[]>([]);
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState("");
  const [fechado, setFechado] = useState(false);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  const recarregar = useCallback(async () => { try { setLista(await lerTodosGrupos()); } catch { setErro("Não foi possível carregar as comunidades."); } }, []);
  useEffect(() => { void recarregar(); }, [recarregar]);

  function abrirCriacao() { setCriando(true); setNome(""); setFechado(false); setMarcados(new Set()); setErro(""); }

  async function criar(e: FormEvent) {
    e.preventDefault();
    setOcupado(true); setErro("");
    const r = await criarGrupoAction(nome, [...marcados].filter((id) => id !== meuId), fechado);
    setOcupado(false);
    if (!r.ok) { setErro(r.mensagem ?? "Não foi possível criar."); return; }
    setCriando(false);
    await recarregar();
  }

  return (
    <section aria-label="Comunidades">
      <div className={estilos.topo}>
        <h2 style={{ margin: 0, fontSize: "var(--fonte-base)" }}>Comunidades</h2>
        {!criando && <Botao variante="secundaria" onClick={abrirCriacao}>Criar comunidade</Botao>}
      </div>
      {erro && <p className={estilos.erro} role="alert">{erro}</p>}
      {criando && (
        <form className={`${estilos.cartao} ${estilos.painelInterno}`} style={{ marginTop: "var(--espaco-3)" }} onSubmit={criar}>
          <Campo id="nome-comunidade" rotulo="Nome da comunidade" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={60} autoComplete="off" />
          <label className={grupos.interruptor}>
            <input type="checkbox" checked={fechado} onChange={(e) => setFechado(e.target.checked)} />
            <span>Somente admins podem enviar mensagens</span>
          </label>
          <SeletorPessoas id="membros-comunidade" pessoas={usuarios.filter((u) => u.id !== meuId).map((u) => ({ id: u.id, nome: u.nome, arroba: u.arroba, foto_url: u.foto_url }))} marcados={marcados}
            aoAlternar={(id) => setMarcados((a) => { const n = new Set(a); if (n.has(id)) n.delete(id); else n.add(id); return n; })} />
          <div className={estilos.acoes}>
            <Botao variante="secundaria" onClick={() => setCriando(false)} disabled={ocupado}>Cancelar</Botao>
            <Botao type="submit" ocupado={ocupado} disabled={!nome.trim()}>Criar</Botao>
          </div>
        </form>
      )}
      <ul className={estilos.lista} aria-label="Comunidades existentes">
        {lista.map((g) => (
          <li className={estilos.cartao} key={g.id}>
            <div className={estilos.topo}>
              <Link className={`${estilos.pessoa} ${estilos.pessoaLink}`} href={`/comunidades?g=${g.id}`}>
                <Avatar nome={g.nome} fotoUrl={g.foto_url} />
                <div className={estilos.dados}>
                  <strong>{g.nome}</strong>
                  <span>{g.membros} membro{g.membros === 1 ? "" : "s"}{g.so_admins ? " · só admins escrevem" : ""}</span>
                </div>
              </Link>
              <MenuAcoes rotulo={`Mais ações de ${g.nome}`} itens={[
                { id: "excluir", rotulo: "Excluir", perigo: true, confirmacao: `Excluir ${g.nome}? Apaga o grupo e todas as mensagens. Não dá para desfazer.`, aoEscolher: async () => {
                  const r = await excluirGrupoAction(g.id);
                  if (!r.ok) return r.mensagem ?? "Não foi possível excluir.";
                  await recarregar();
                  return null;
                } },
              ]} />
            </div>
          </li>
        ))}
        {lista.length === 0 && <li className={estilos.vazio}>Nenhuma comunidade criada.</li>}
      </ul>
    </section>
  );
}
