import { CabecalhoMobile, Carregando, LayoutMobile } from "@design/componentes";

/** Mostrada enquanto a página carrega no servidor. */
export default function Carregamento() {
  return (
    <LayoutMobile cabecalho={<CabecalhoMobile titulo="Painel Dev" subtitulo="Carregando usuários" />}>
      <div style={{ display: "grid", placeItems: "center", padding: "3rem 0" }}><Carregando /></div>
    </LayoutMobile>
  );
}
