export type AvatarPredefinido = { id: string; nome: string; svg: string };

const moldura = (fundo: string, miolo: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">${fundo}${miolo}</svg>`;
const degrade = (id: string, a: string, b: string) =>
  `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="256" height="256" fill="url(#${id})"/>`;

const poli = (pontos: string, cor: string, extra = "") => `<polygon points="${pontos}" fill="${cor}"${extra}/>`;
/** Estrela de n pontas (raio externo/interno) centrada em (128,128), para facetas simétricas. */
const raios = (n: number, ext: number, int: number, cx = 128, cy = 128) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const ang = (Math.PI * i) / n - Math.PI / 2;
    const r = i % 2 === 0 ? ext : int;
    return `${(cx + r * Math.cos(ang)).toFixed(1)},${(cy + r * Math.sin(ang)).toFixed(1)}`;
  }).join(" ");
const regular = (n: number, r: number, cx = 128, cy = 128, giro = -Math.PI / 2) =>
  Array.from({ length: n }, (_, i) => {
    const ang = giro + (2 * Math.PI * i) / n;
    return `${(cx + r * Math.cos(ang)).toFixed(1)},${(cy + r * Math.sin(ang)).toFixed(1)}`;
  }).join(" ");
/** Metades de um polígono regular com tons diferentes (efeito low-poly). */
const facetas = (n: number, r: number, claro: string, escuro: string, cx = 128, cy = 128) =>
  Array.from({ length: n }, (_, i) => {
    const a1 = -Math.PI / 2 + (2 * Math.PI * i) / n;
    const a2 = -Math.PI / 2 + (2 * Math.PI * (i + 1)) / n;
    const pt = (a: number) => `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    return poli(`${cx},${cy} ${pt(a1)} ${pt(a2)}`, i % 2 === 0 ? claro : escuro);
  }).join("");

/** Imagens originais do TeamTalk (formas simples), para quem não quer enviar foto própria. */
export const AVATARES_PREDEFINIDOS: AvatarPredefinido[] = [
  { id: "sol", nome: "Sol", svg: moldura(degrade("a", "#ffd98a", "#ff9a3c"), poli(raios(12, 92, 62), "#fff1c9") + facetas(8, 46, "#ffd36e", "#ffb84d")) },
  { id: "montanha", nome: "Montanha", svg: moldura(degrade("a", "#9fd3ff", "#e8f4ff"), `<path d="M0 220 L90 90 L150 170 L190 120 L256 220Z" fill="#3b6ea5"/><path d="M90 90 L112 122 L90 112 L70 124Z" fill="#fff"/>`) },
  { id: "onda", nome: "Onda", svg: moldura(degrade("a", "#4fb3ff", "#1d5fd1"), `<path d="M0 140 Q64 90 128 140 T256 140 V256 H0Z" fill="#e6f3ff" opacity=".9"/><path d="M0 180 Q64 130 128 180 T256 180 V256 H0Z" fill="#fff" opacity=".8"/>`) },
  { id: "folha", nome: "Folha", svg: moldura(degrade("a", "#a6e8a0", "#3fa65b"), poli("70,190 62,132 100,86 150,60 196,60", "#f2fff0") + poli("70,190 112,202 168,176 198,126 196,60", "#c6edc2") + `<line x1="70" y1="190" x2="196" y2="60" stroke="#3fa65b" stroke-width="6" stroke-linecap="round"/>` + poli("70,190 50,210 60,218 80,200", "#2f8a49")) },
  { id: "lua", nome: "Lua", svg: moldura(degrade("a", "#2a3a6b", "#0f1730"), `<path d="M170 60 A76 76 0 1 0 196 170 A60 60 0 1 1 170 60Z" fill="#ffe9a8"/><circle cx="60" cy="60" r="5" fill="#fff"/><circle cx="210" cy="84" r="4" fill="#fff"/><circle cx="188" cy="214" r="3" fill="#fff"/>`) },
  { id: "flor", nome: "Flor", svg: moldura(degrade("a", "#ffc2dd", "#ff7fb0"), [0, 60, 120, 180, 240, 300].map((g) => `<ellipse cx="128" cy="76" rx="26" ry="42" fill="#fff" opacity=".92" transform="rotate(${g} 128 128)"/>`).join("") + `<circle cx="128" cy="128" r="24" fill="#ffc83d"/>`) },
  { id: "estrela", nome: "Estrela", svg: moldura(degrade("a", "#b79bff", "#6a3fd1"), `<polygon points="128,44 150,104 214,106 164,146 182,208 128,172 74,208 92,146 42,106 106,104" fill="#fff4b8"/>`) },
  { id: "gota", nome: "Gota", svg: moldura(degrade("a", "#8ff0e6", "#1fa7b8"), `<path d="M128 46 C170 100 192 130 192 164 A64 64 0 0 1 64 164 C64 130 86 100 128 46Z" fill="#effffd"/>`) },
  { id: "raio", nome: "Raio", svg: moldura(degrade("a", "#ffe066", "#ff9f1a"), `<polygon points="148,36 82,138 124,138 104,220 176,112 132,112" fill="#fffbe6"/>`) },
  { id: "diamante", nome: "Diamante", svg: moldura(degrade("a", "#ff9a9e", "#d9436b"), `<polygon points="128,50 200,110 128,210 56,110" fill="#fff0f3"/><polygon points="128,50 164,110 128,210 92,110" fill="#ffd0d8"/>`) },
  { id: "hexagonos", nome: "Hexágonos", svg: moldura(degrade("a", "#7ee8c0", "#2a9d8f"), poli(regular(6, 88), "#e8fff6") + facetas(6, 58, "#7ee8c0", "#52cfa6") + poli(regular(6, 26), "#fff")) },
  { id: "por-do-sol", nome: "Pôr do sol", svg: moldura(degrade("a", "#ff8a5c", "#7a4fa3"), poli(regular(12, 54, 128, 150), "#ffd36e") + poli("0,206 52,150 92,186 144,128 196,180 256,142 256,256 0,256", "#4d3480") + poli("144,128 196,180 150,196 112,170", "#5f4399") + poli("0,236 62,196 114,230 172,192 256,238 256,256 0,256", "#2f2150")) },
  { id: "pinguim", nome: "Pinguim", svg: moldura(degrade("a", "#a8e6ff", "#3f86c9"),
    poli("72,112 44,164 66,180 86,142", "#1c2540") + poli("184,112 212,164 190,180 170,142", "#26324f") +
    poli("128,40 166,56 186,100 194,162 176,210 128,226 80,210 62,162 70,100 90,56", "#26324f") +
    poli("128,40 90,56 70,100 62,162 80,210 128,226", "#1c2540") +
    poli("128,98 160,120 168,168 150,206 128,214 106,206 88,168 96,120", "#f4fbff") +
    poli("128,98 160,120 168,168 150,206 128,214", "#d8ecfb") +
    poli("114,92 128,84 142,92 128,108", "#ffb84d") + poli("114,92 128,108 142,92 128,98", "#ff8a00") +
    `<circle cx="112" cy="76" r="6" fill="#fff"/><circle cx="144" cy="76" r="6" fill="#fff"/><circle cx="113" cy="77" r="2.6" fill="#14203a"/><circle cx="143" cy="77" r="2.6" fill="#14203a"/>` +
    poli("84,220 120,224 114,240 74,238", "#ff8a00") + poli("136,224 172,220 182,238 142,240", "#ffb84d")) },
];

export const urlDoAvatar = (a: AvatarPredefinido) => `data:image/svg+xml;utf8,${encodeURIComponent(a.svg)}`;
