import estilos from "@design/componentes/lista-regras.module.css";

export type Regra = { texto: string; ok: boolean };

type Props = {
  id: string;
  regras: Regra[];
  /** Enquanto o campo não foi tocado, as regras aparecem neutras (sem cobrar o usuário). */
  ativa: boolean;
};

/** Lista de condições que muda para ✓ (atendida) ou ✕ (pendente) conforme o usuário digita. */
export function ListaRegras({ id, regras, ativa }: Props) {
  return (
    <ul className={estilos.lista} id={id} aria-label="Condições">
      {regras.map((regra) => {
        const estado = !ativa ? "neutro" : regra.ok ? "ok" : "erro";
        const marca = estado === "ok" ? "✓" : estado === "erro" ? "✕" : "•";
        const leitor = estado === "ok" ? "Atendida: " : estado === "erro" ? "Pendente: " : "";
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
