/** Um grupo (comunidade) na lista de quem participa. */
export type GrupoResumo = {
  id: string;
  nome: string;
  foto_path: string | null;
  foto_url: string | null;
  so_admins: boolean;
  membros: number;
  ultima_texto: string | null;
  ultima_em: string;
  ultima_minha: boolean;
  nao_lidas: number;
  posso_escrever: boolean;
};

export type MembroGrupo = {
  id: string;
  nome: string;
  arroba: string;
  foto_url: string | null;
  admin: boolean;
  lida_ate: string;
  entrou_em: string;
};

/** Linha do painel Admin: todos os grupos. */
export type GrupoAdmin = { id: string; nome: string; foto_url: string | null; so_admins: boolean; membros: number };
