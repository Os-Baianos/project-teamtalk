import estilos from "@design/componentes/lista-regras.module.css";

export type Regra = { texto: string; ok: boolean };

type Props = {
  id: string;
  regras: Regra[];
  /** Só mostra a lista depois que o usuário mexeu no campo. */
  ativa: boolean;
};

/** Lista de condições que muda para ✓ (atendida) ou ✕ (pendente) conforme o usuário digita. */
export function ListaRegras({ id, regras, ativa }: Props) {
  if (!ativa) return null;
  return (
    <ul className={estilos.lista} id={id} aria-label="Condições">
      {regras.map((regra) => {
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
