# Sem o azul do navegador ao tocar (celular)

- Quem: Ace (com Claude)
- O quê: removido o clarão azul que o navegador do celular mostra ao tocar em links e botões (`-webkit-tap-highlight-color: transparent` global em `src/design/estilos.css`). Também `touch-action: manipulation` nos itens clicáveis (sem atraso/zoom de toque duplo).
- Acessibilidade: o contorno de foco por teclado (`:focus-visible`) não mudou.
