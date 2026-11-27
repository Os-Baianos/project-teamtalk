# Instalar o TeamTalk no celular (PWA)

- Quem: Ace (com Claude)
- O quê: o site pode ser adicionado à tela inicial e abre em tela cheia, com o símbolo laranja. Continua usando a internet normal; não há modo offline.
- Como: `src/app/manifest.ts`, ícones em `public/icones/` (192 e 512) e `src/app/apple-icon.png` (iPhone), `appleWebApp` e `themeColor` no `layout.tsx`, e margem da área do notch/barra inferior na barra de cima e no rodapé.
- Android: Chrome → "Instalar app". iPhone: Safari → Compartilhar → "Adicionar à Tela de Início".
