const PREFIXO = "tt:";

/** Última cópia guardada nesta aba (mostra a tela na hora enquanto os dados novos chegam). */
export function lerCache<T>(chave: string): T | null {
  try {
    const bruto = sessionStorage.getItem(PREFIXO + chave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    return null;
  }
}

export function gravarCache<T>(chave: string, valor: T) {
  try { sessionStorage.setItem(PREFIXO + chave, JSON.stringify(valor)); } catch { /* cheio ou bloqueado: segue sem cache */ }
}

/** Apaga tudo ao sair da conta, para a próxima pessoa não ver dados de quem saiu. */
export function limparCache() {
  try {
    Object.keys(sessionStorage).filter((k) => k.startsWith(PREFIXO)).forEach((k) => sessionStorage.removeItem(k));
  } catch { /* ignora */ }
}
