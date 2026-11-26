# Barra de cima e rodapé fixos

- Quem: Ace (com Claude)
- O quê: em todas as telas, a barra superior e o rodapé ficam sempre parados; só a área de conteúdo rola.
- Como: `.aplicacao` passou a ter a altura da janela (`100dvh`, sem rolagem) e `.aplicacao-conteudo` rola por dentro (`src/design/estilos.css`). Antes isso valia só em Conversas (`pagina-cheia`).
