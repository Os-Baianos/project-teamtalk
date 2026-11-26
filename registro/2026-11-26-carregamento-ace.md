# Carregamento (círculo girando) e animações do Perfil

Quem: Pedro França Leal (Acebmoon)
Data: 2026-11-26

## O que foi feito
- Componente novo `Carregando` (design/componentes): círculo girando no estilo do console AWS. Herda a cor, anuncia "Carregando" para leitor de tela e fica parado quando a pessoa pede menos movimento.
- Usado em: botões ocupados (no lugar das reticências), sugestões da busca de contatos, "Meus contatos", lista de Conversas e nas páginas Perfil e Painel Dev (`loading.tsx`) enquanto carregam.
- Perfil: animações do padrão do site nas partes que faltavam (campo de editar nome, botões e mensagens).
