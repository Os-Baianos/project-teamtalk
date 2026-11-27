import type { MetadataRoute } from "next";

/** Permite "instalar" o TeamTalk no celular: abre em tela cheia, com o símbolo do app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TeamTalk",
    short_name: "TeamTalk",
    description: "Chat corporativo interno",
    start_url: "/",
    display: "standalone",
    background_color: "#161d26",
    theme_color: "#161d26",
    lang: "pt-BR",
    icons: [
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
