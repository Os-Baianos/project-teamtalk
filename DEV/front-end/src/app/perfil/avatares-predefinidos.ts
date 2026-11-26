export type AvatarPredefinido = { id: string; nome: string; svg: string };

const moldura = (fundo: string, miolo: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">${fundo}${miolo}</svg>`;
const degrade = (id: string, a: string, b: string) =>
  `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="256" height="256" fill="url(#${id})"/>`;

/** Imagens originais do TeamTalk (formas simples), para quem não quer enviar foto própria. */
export const AVATARES_PREDEFINIDOS: AvatarPredefinido[] = [
  { id: "sol", nome: "Sol", svg: moldura(degrade("a", "#ffd98a", "#ff9a3c"), `<circle cx="128" cy="128" r="58" fill="#fff4d6"/>`) },
  { id: "montanha", nome: "Montanha", svg: moldura(degrade("a", "#9fd3ff", "#e8f4ff"), `<path d="M0 220 L90 90 L150 170 L190 120 L256 220Z" fill="#3b6ea5"/><path d="M90 90 L112 122 L90 112 L70 124Z" fill="#fff"/>`) },
  { id: "onda", nome: "Onda", svg: moldura(degrade("a", "#4fb3ff", "#1d5fd1"), `<path d="M0 140 Q64 90 128 140 T256 140 V256 H0Z" fill="#e6f3ff" opacity=".9"/><path d="M0 180 Q64 130 128 180 T256 180 V256 H0Z" fill="#fff" opacity=".8"/>`) },
  { id: "folha", nome: "Folha", svg: moldura(degrade("a", "#a6e8a0", "#3fa65b"), `<path d="M70 190 C70 100 130 60 200 60 C200 130 160 190 70 190Z" fill="#f2fff0"/><path d="M70 190 L160 100" stroke="#3fa65b" stroke-width="8" stroke-linecap="round"/>`) },
  { id: "lua", nome: "Lua", svg: moldura(degrade("a", "#2a3a6b", "#0f1730"), `<path d="M170 60 A76 76 0 1 0 196 170 A60 60 0 1 1 170 60Z" fill="#ffe9a8"/><circle cx="60" cy="60" r="5" fill="#fff"/><circle cx="210" cy="84" r="4" fill="#fff"/><circle cx="188" cy="214" r="3" fill="#fff"/>`) },
  { id: "flor", nome: "Flor", svg: moldura(degrade("a", "#ffc2dd", "#ff7fb0"), [0, 60, 120, 180, 240, 300].map((g) => `<ellipse cx="128" cy="76" rx="26" ry="42" fill="#fff" opacity=".92" transform="rotate(${g} 128 128)"/>`).join("") + `<circle cx="128" cy="128" r="24" fill="#ffc83d"/>`) },
  { id: "estrela", nome: "Estrela", svg: moldura(degrade("a", "#b79bff", "#6a3fd1"), `<polygon points="128,44 150,104 214,106 164,146 182,208 128,172 74,208 92,146 42,106 106,104" fill="#fff4b8"/>`) },
  { id: "gota", nome: "Gota", svg: moldura(degrade("a", "#8ff0e6", "#1fa7b8"), `<path d="M128 46 C170 100 192 130 192 164 A64 64 0 0 1 64 164 C64 130 86 100 128 46Z" fill="#effffd"/>`) },
  { id: "raio", nome: "Raio", svg: moldura(degrade("a", "#ffe066", "#ff9f1a"), `<polygon points="148,36 82,138 124,138 104,220 176,112 132,112" fill="#fffbe6"/>`) },
  { id: "diamante", nome: "Diamante", svg: moldura(degrade("a", "#ff9a9e", "#d9436b"), `<polygon points="128,50 200,110 128,210 56,110" fill="#fff0f3"/><polygon points="128,50 164,110 128,210 92,110" fill="#ffd0d8"/>`) },
  { id: "circulos", nome: "Círculos", svg: moldura(degrade("a", "#7ee8c0", "#2a9d8f"), `<circle cx="128" cy="128" r="84" fill="#e8fff6"/><circle cx="128" cy="128" r="56" fill="#7ee8c0"/><circle cx="128" cy="128" r="28" fill="#fff"/>`) },
  { id: "por-do-sol", nome: "Pôr do sol", svg: moldura(degrade("a", "#ff7e5f", "#6a4c93"), `<circle cx="128" cy="150" r="52" fill="#ffd36e"/><rect y="150" width="256" height="106" fill="#3b2a63"/><rect x="40" y="172" width="176" height="6" fill="#ffd36e" opacity=".7"/><rect x="64" y="192" width="128" height="6" fill="#ffd36e" opacity=".5"/>`) },
];

export const urlDoAvatar = (a: AvatarPredefinido) => `data:image/svg+xml;utf8,${encodeURIComponent(a.svg)}`;
