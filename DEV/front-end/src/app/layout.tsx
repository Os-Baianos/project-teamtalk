import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { BarraTopo, RodapeTopo } from "@design/componentes";
import "@design/estilos.css";

export const metadata: Metadata = {
  title: "TeamTalk",
  appleWebApp: { capable: true, title: "TeamTalk", statusBarStyle: "black-translucent" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#161d26" };

export default function LayoutRaiz({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="aplicacao">
        <BarraTopo />
        <div className="aplicacao-conteudo">{children}</div>
        <RodapeTopo />
      </body>
    </html>
  );
}
