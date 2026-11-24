import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@design/estilos.css";

export const metadata: Metadata = { title: "TeamTalk" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function LayoutRaiz({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
