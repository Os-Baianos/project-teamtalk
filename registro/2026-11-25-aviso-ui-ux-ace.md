# Componente Aviso em UI-UX

Quem: Pedro França Leal (Acebmoon)
Data: 2026-11-25
PR: ver PR "Aviso como componente em UI-UX, com animação ao fechar"

## O que foi feito
- O aviso azul do login virou o componente `Aviso`, guardado em `UI-UX/componentes/aviso.tsx` (e copiado em `DEV/front-end/src/design/componentes/`).
- Ícones novos em `UI-UX/icones/`: `informacao.svg` e `fechar.svg` (também no `Icone`).
- Ao fechar, o aviso some com fade e encolhendo (~250 ms); sem animação quando o sistema pede menos movimento.
- Documentado na tabela de componentes de `UI-UX/README.md`.
- O estilo solto `[role="status"]` saiu do CSS global; o estilo agora vive no componente.

## Arquivos criados ou alterados
- UI-UX/componentes/aviso.tsx, aviso.module.css, index.ts
- UI-UX/icones/informacao.svg, fechar.svg, icone.tsx
- UI-UX/README.md, UI-UX/estilos.css, UI-UX/telas/login.tsx
- DEV/front-end/src/design/ (cópias equivalentes) e telas/login.tsx

## Novidades para quem vai usar
- Todos: `import { Aviso } from "@design/componentes"` e `<Aviso>texto</Aviso>`. Use para avisos informativos; não crie outro estilo de aviso.
- UI-UX (#132, Gil e Luana): revisem o desenho do `Aviso` e dos ícones `informacao` e `fechar`, que o Ace pediu em caráter provisório; se mudarem, alterem só esses arquivos.

## Pendências e dúvidas
- Variações de aviso (erro, sucesso, atenção) ainda não existem.
