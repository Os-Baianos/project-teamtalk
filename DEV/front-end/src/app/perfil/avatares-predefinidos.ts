export type AvatarPredefinido = { id: string; nome: string; src: string };

/**
 * Fotos predefinidas (animais e flores), no estilo das imagens padrão de perfil do Mac.
 * Todas são do Wikimedia Commons em CC0 (domínio público); a origem de cada uma está em registro/.
 * Arquivos em public/avatares, 256x256.
 */
const foto = (id: string, nome: string): AvatarPredefinido => ({ id, nome, src: `/avatares/${id}.jpg` });

export const AVATARES_PREDEFINIDOS: AvatarPredefinido[] = [
  foto("aguia", "Águia"),
  foto("arara", "Arara"),
  foto("coruja", "Coruja"),
  foto("tigre", "Tigre"),
  foto("zebra", "Zebra"),
  foto("pinguim", "Pinguim"),
  foto("girassol", "Girassol"),
  foto("rosa", "Rosa"),
  foto("lotus", "Lótus"),
  foto("papoula", "Papoula"),
  foto("dente-de-leao", "Dente-de-leão"),
  foto("joaninha", "Joaninha"),
];

export const urlDoAvatar = (a: AvatarPredefinido) => a.src;
