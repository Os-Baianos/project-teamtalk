import estilos from "./avatar.module.css";

type Props = { nome: string; fotoUrl?: string | null };

/** Foto de perfil; sem foto, mostra a inicial do nome. */
export function Avatar({ nome, fotoUrl }: Props) {
  return fotoUrl
    ? <img className={`${estilos.avatar} ${estilos.foto}`} src={fotoUrl} alt="" />
    : <span className={estilos.avatar} aria-hidden="true">{nome[0]?.toUpperCase()}</span>;
}
