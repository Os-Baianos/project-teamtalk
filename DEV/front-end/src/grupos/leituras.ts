"use client";

import { criarClienteNavegador } from "../supabase/navegador";
import type { Mensagem } from "../mensagens/acoes";
import type { GrupoAdmin, GrupoResumo, MembroGrupo } from "./tipos";

/** Leituras de comunidades direto do navegador para o Supabase (a segurança fica nas regras do banco). */

const banco = () => criarClienteNavegador();
const urlFoto = (caminho: string | null) => (caminho ? banco().storage.from("avatares").getPublicUrl(caminho).data.publicUrl : null);

export async function lerGrupos(): Promise<GrupoResumo[]> {
  const { data, error } = await banco().rpc("grupo_listar");
  if (error) throw new Error(error.message);
  return ((data ?? []) as (Omit<GrupoResumo, "foto_url" | "membros" | "nao_lidas"> & { membros: number | string; nao_lidas: number | string })[]).map((g) => ({
    ...g, membros: Number(g.membros), nao_lidas: Number(g.nao_lidas), foto_url: urlFoto(g.foto_path),
  }));
}

export async function lerTodosGrupos(): Promise<GrupoAdmin[]> {
  const { data, error } = await banco().rpc("grupo_listar_todos");
  if (error) throw new Error(error.message);
  return ((data ?? []) as { id: string; nome: string; foto_path: string | null; so_admins: boolean; membros: number | string }[]).map((g) => ({
    id: g.id, nome: g.nome, so_admins: g.so_admins, membros: Number(g.membros), foto_url: urlFoto(g.foto_path),
  }));
}

export async function lerMembros(grupoId: string): Promise<MembroGrupo[]> {
  const { data, error } = await banco().from("grupo_membros")
    .select("usuario_id, lida_ate, entrou_em, perfis(nome, arroba, foto_path, papel)").eq("grupo_id", grupoId);
  if (error) throw new Error(error.message);
  type Linha = { usuario_id: string; lida_ate: string; entrou_em: string; perfis: { nome: string; arroba: string; foto_path: string | null; papel: string } | { nome: string; arroba: string; foto_path: string | null; papel: string }[] | null };
  return ((data ?? []) as unknown as Linha[]).flatMap((l) => {
    const p = Array.isArray(l.perfis) ? l.perfis[0] : l.perfis;
    return p ? [{ id: l.usuario_id, nome: p.nome, arroba: p.arroba, foto_url: urlFoto(p.foto_path), admin: p.papel === "dev", lida_ate: l.lida_ate, entrou_em: l.entrou_em }] : [];
  }).sort((a, b) => Number(b.admin) - Number(a.admin) || a.nome.localeCompare(b.nome));
}

export async function lerMensagensGrupo(grupoId: string): Promise<Mensagem[]> {
  const { data, error } = await banco().from("mensagens").select("*").eq("grupo_id", grupoId).order("criado_em", { ascending: true }).limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []) as Mensagem[];
}

/** Nome e foto de quem escreveu (inclui quem já saiu do grupo). */
export async function lerAutores(ids: string[]): Promise<Record<string, { nome: string; foto_url: string | null }>> {
  if (ids.length === 0) return {};
  const { data } = await banco().from("perfis").select("id, nome, foto_path").in("id", ids);
  return Object.fromEntries((data ?? []).map((p) => [p.id as string, { nome: p.nome as string, foto_url: urlFoto(p.foto_path as string | null) }]));
}

export async function marcarLidoGrupo(grupoId: string) {
  await banco().rpc("grupo_marcar_lido", { g: grupoId });
}

/** Define (ou tira, com null) a foto do grupo: sobe a imagem reduzida e guarda o caminho. */
export async function definirFotoGrupo(grupoId: string, arquivo: File | null, meuId: string): Promise<string | null> {
  const supabase = banco();
  if (!arquivo) {
    const { error } = await supabase.rpc("grupo_foto", { g: grupoId, caminho: null });
    return error ? "Não foi possível tirar a foto." : null;
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type) || arquivo.size > 2 * 1024 * 1024) return "Use uma imagem JPG, PNG ou WebP de até 2 MB.";
  const caminho = `${meuId}/grupo-${grupoId}-${Date.now()}`;
  const { error } = await supabase.storage.from("avatares").upload(caminho, arquivo, { contentType: arquivo.type });
  if (error) return "Não foi possível enviar a foto.";
  const { error: erroRpc } = await supabase.rpc("grupo_foto", { g: grupoId, caminho });
  return erroRpc ? "Não foi possível salvar a foto." : null;
}
