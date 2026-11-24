import type { Regra } from "@design/componentes/lista-regras";

export const regrasNome = (nome: string): Regra[] => [
  { texto: "Nome e sobrenome", ok: nome.trim().split(/\s+/).filter((p) => p.length >= 2).length >= 2 },
];

export const regrasArroba = (arroba: string): Regra[] => [
  { texto: "De 3 a 20 caracteres", ok: arroba.length >= 3 && arroba.length <= 20 },
  { texto: "Só letras minúsculas, números, ponto ou _", ok: /^[a-z0-9_.]+$/.test(arroba) },
  { texto: "Começa com uma letra", ok: /^[a-z]/.test(arroba) },
];

export const regrasEmail = (email: string): Regra[] => [
  { texto: "Digite um e-mail válido", ok: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) },
];

export const regrasSenha = (senha: string): Regra[] => [
  { texto: "Pelo menos 6 caracteres", ok: senha.length >= 6 },
  { texto: "Uma letra maiúscula", ok: /[A-Z]/.test(senha) },
  { texto: "Uma letra minúscula", ok: /[a-z]/.test(senha) },
  { texto: "Um número", ok: /\d/.test(senha) },
  { texto: "Um símbolo (ex.: ! @ # $)", ok: /[^A-Za-z0-9]/.test(senha) },
  { texto: "No máximo 72 caracteres", ok: senha.length <= 72 },
];

export const regrasConfirmacao = (senha: string, confirmacao: string): Regra[] => [
  { texto: "As senhas são iguais", ok: confirmacao.length > 0 && senha === confirmacao },
];

export const todasOk = (...grupos: Regra[][]) => grupos.every((g) => g.every((r) => r.ok));
