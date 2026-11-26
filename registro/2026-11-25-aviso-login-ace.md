# Ajuste: aviso "Entre para continuar."

Quem: Pedro França Leal (Acebmoon)
Data: 2026-11-25
PR: ver PR "Aviso do login no estilo da AWS"

## O que foi feito
- O aviso do login estava verde (fora do tema). Agora é uma faixa azul sólida (`--cor-foco`) com texto branco, como os avisos da AWS.
- A pedido do Ace, ganhou ícone de informação (círculo com i) e botão X para fechar, feitos em SVG simples no próprio código, pois não existem em UI-UX.

## Arquivos criados ou alterados
- DEV/front-end/src/design/estilos.css

## Novidades para quem vai usar
- UI-UX (#132): se existir um padrão oficial de aviso (com ícone de informação e botão de fechar, que hoje são provisórios), avisem para trocarmos.

## Pendências e dúvidas
- Nenhuma.
