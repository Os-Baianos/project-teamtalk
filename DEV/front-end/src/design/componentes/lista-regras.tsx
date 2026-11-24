import type { ModoLista } from "@design/modo-lista";
import estilos from "@design/componentes/lista-regras.module.css";

export type Regra = { texto: string; ok: boolean };

type Props = {
  id: string;
  regras: Regra[];
  /** Define se a lista fica oculta, mostra só o que está certo, ou mostra tudo. */
  modo: ModoLista;
};

/** Lista de condições que muda para ✓ (atendida) ou ✕ (pendente) conforme o usuário digita. */
export function ListaRegras({ id, regras, modo }: Props) {
  const visiveis = modo === "somenteOk" ? regras.filter((r) => r.ok) : regras;
  if (modo === "oculta" || visiveis.length === 0) return null;
  return (
    <ul className={estilos.lista} id={id} aria-label="Condições">
      {visiveis.map((regra) => {
        const estado = regra.ok ? "ok" : "erro";
        const marca = estado === "ok" ? "✓" : "✕";
        const leitor = estado === "ok" ? "Atendida: " : "Pendente: ";
        return (
          <li className={estilos.regra} data-estado={estado} key={regra.texto}>
            <span className={estilos.marca} aria-hidden="true">{marca}</span>
            <span><span className={estilos.leitor}>{leitor}</span>{regra.texto}</span>
          </li>
        );
      })}
    </ul>
  );
}
