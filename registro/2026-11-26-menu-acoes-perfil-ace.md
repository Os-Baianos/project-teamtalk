# Perfil mais limpo: menu "⋯" no lugar de botões empilhados

Quem: Ace (Acebmoon)
Data: 2026-11-26

## O que foi feito
- Novo componente `MenuAcoes` (botão "⋯" com lista de ações e confirmação) em `design/componentes`, exportado em `index.ts`.
- No perfil de um contato: só "Conversar" fica à mostra; "Remover contato" e "Excluir conversa" ficam no menu, cada um com confirmação.
- Quem não é contato continua com os botões de solicitação; "Excluir conversa" fica no menu quando existe conversa.
- Padrão documentado em `UI-UX/README.md` (Componentes e contratos): uma ação principal visível, as secundárias no menu.

## Arquivos criados ou alterados
- DEV/front-end/src/design/componentes/{menu-acoes.tsx, menu-acoes.module.css, index.ts}
- DEV/front-end/src/app/perfil/[arroba]/acoes-perfil.tsx, src/app/perfil/perfil.module.css
- UI-UX/README.md

## Novidades para quem vai usar
Componente novo `MenuAcoes` (tabela de componentes do UI-UX/README.md). Usa só tokens existentes; Gil e Luana podem revisar o visual.
