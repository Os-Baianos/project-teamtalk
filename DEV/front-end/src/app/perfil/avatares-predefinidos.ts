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
  { id: "sol", nome: "Sol", svg: moldura(degrade("a", "#ffd98a", "#ff9a3c"), poli(raios(8, 84, 54), "#fff1c9") + poli(regular(8, 36), "#ffc94d")) },
  { id: "montanha", nome: "Montanha", svg: moldura(degrade("a", "#9fd3ff", "#e8f4ff"), `<path d="M0 220 L90 90 L150 170 L190 120 L256 220Z" fill="#3b6ea5"/><path d="M90 90 L112 122 L90 112 L70 124Z" fill="#fff"/>`) },
  { id: "onda", nome: "Onda", svg: moldura(degrade("a", "#4fb3ff", "#1d5fd1"), `<path d="M0 140 Q64 90 128 140 T256 140 V256 H0Z" fill="#e6f3ff" opacity=".9"/><path d="M0 180 Q64 130 128 180 T256 180 V256 H0Z" fill="#fff" opacity=".8"/>`) },
  { id: "folha", nome: "Folha", svg: moldura(degrade("a", "#a6e8a0", "#3fa65b"), `<g transform="rotate(40 128 128)">` + poli("128,34 84,84 84,152 128,202", "#f2fff0") + poli("128,34 172,84 172,152 128,202", "#c9eec5") + poli("123,202 133,202 133,230 123,230", "#2f8a49") + `</g>`) },
  { id: "lua", nome: "Lua", svg: moldura(degrade("a", "#2a3a6b", "#0f1730"), `<path d="M170 60 A76 76 0 1 0 196 170 A60 60 0 1 1 170 60Z" fill="#ffe9a8"/><circle cx="60" cy="60" r="5" fill="#fff"/><circle cx="210" cy="84" r="4" fill="#fff"/><circle cx="188" cy="214" r="3" fill="#fff"/>`) },
  { id: "flor", nome: "Flor", svg: moldura(degrade("a", "#ffc2dd", "#ff7fb0"), [0, 60, 120, 180, 240, 300].map((g) => `<ellipse cx="128" cy="76" rx="26" ry="42" fill="#fff" opacity=".92" transform="rotate(${g} 128 128)"/>`).join("") + `<circle cx="128" cy="128" r="24" fill="#ffc83d"/>`) },
  { id: "estrela", nome: "Estrela", svg: moldura(degrade("a", "#b79bff", "#6a3fd1"), `<polygon points="128,44 150,104 214,106 164,146 182,208 128,172 74,208 92,146 42,106 106,104" fill="#fff4b8"/>`) },
  { id: "gota", nome: "Gota", svg: moldura(degrade("a", "#8ff0e6", "#1fa7b8"), `<path d="M128 46 C170 100 192 130 192 164 A64 64 0 0 1 64 164 C64 130 86 100 128 46Z" fill="#effffd"/>`) },
  { id: "raio", nome: "Raio", svg: moldura(degrade("a", "#ffe066", "#ff9f1a"), `<polygon points="148,36 82,138 124,138 104,220 176,112 132,112" fill="#fffbe6"/>`) },
  { id: "diamante", nome: "Diamante", svg: moldura(degrade("a", "#ff9a9e", "#d9436b"), `<polygon points="128,50 200,110 128,210 56,110" fill="#fff0f3"/><polygon points="128,50 164,110 128,210 92,110" fill="#ffd0d8"/>`) },
  { id: "hexagonos", nome: "Hexágonos", svg: moldura(degrade("a", "#7ee8c0", "#2a9d8f"), poli(regular(6, 86), "#e8fff6") + poli(regular(6, 46), "#52cfa6")) },
  { id: "por-do-sol", nome: "Pôr do sol", svg: moldura(degrade("a", "#ff8a5c", "#7a4fa3"), poli(regular(12, 54, 128, 150), "#ffd36e") + poli("0,206 52,150 92,186 144,128 196,180 256,142 256,256 0,256", "#4d3480") + poli("144,128 196,180 150,196 112,170", "#5f4399") + poli("0,236 62,196 114,230 172,192 256,238 256,256 0,256", "#2f2150")) },
  { id: "pinguim", nome: "Pinguim", svg: moldura(degrade("a", "#a8e6ff", "#3f86c9"),
    poli("68,116 36,178 74,180", "#26324f") + poli("188,116 220,178 182,180", "#26324f") +
    poli("128,40 178,70 198,150 172,214 84,214 58,150 78,70", "#26324f") +
    poli("128,100 160,114 172,162 154,206 128,214 102,206 84,162 96,114", "#f4fbff") +
    poli("114,88 142,88 128,108", "#ff9f1a") +
    `<circle cx="110" cy="72" r="6.5" fill="#fff"/><circle cx="146" cy="72" r="6.5" fill="#fff"/><circle cx="111" cy="73" r="3" fill="#14203a"/><circle cx="145" cy="73" r="3" fill="#14203a"/>` +
    poli("88,214 122,214 102,234", "#ff9f1a") + poli("134,214 168,214 154,234", "#ff9f1a")) },
];

export const urlDoAvatar = (a: AvatarPredefinido) => `data:image/svg+xml;utf8,${encodeURIComponent(a.svg)}`;
