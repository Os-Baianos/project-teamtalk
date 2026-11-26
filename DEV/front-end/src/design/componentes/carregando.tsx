import estilos from "./carregando.module.css";

export type PropsCarregando = {
  /** Tamanho do círculo (qualquer medida CSS). */
  tamanho?: string;
  /** Texto lido por leitores de tela; vazio esconde o aviso (quando o botão já avisa). */
  texto?: string;
  /** "herdar" usa a cor do texto em volta (dentro de botões); o padrão é azul. */
  cor?: "link" | "herdar";
  /** Só aparece depois de 0,3 s: carregamentos rápidos não piscam o círculo. */
  atraso?: boolean;
  className?: string;
};

/** Círculo girando, igual ao carregamento do console AWS. Herda a cor do texto. */
export function Carregando({ tamanho = "2rem", texto = "Carregando", cor = "link", atraso = false, className = "" }: PropsCarregando) {
  return (
    <span className={`${estilos.caixa} ${cor === "herdar" ? estilos.herdar : ""} ${atraso ? estilos.atrasado : ""} ${className}`} role={texto ? "status" : undefined} aria-hidden={texto ? undefined : true}>
      <svg className={estilos.circulo} width={tamanho} height={tamanho} viewBox="0 0 50 50" aria-hidden="true">
        <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="95 31" />
      </svg>
      {texto && <span className={estilos.texto}>{texto}</span>}
    </span>
  );
}
