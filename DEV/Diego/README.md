# Issue #117 — conversas e chat

Esta pasta contém a implementação isolada da tela da issue #117, pronta para revisão e integração na aplicação em `DEV/front-end`.

## Integração

1. Substitua os arquivos da rota `src/app/conversas/` pelos arquivos espelhados em `front-end/src/app/conversas/`.
2. Ao mover `page.tsx` e `tela-conversas.tsx`, ajuste os imports `../../../../../front-end/src/...` para os imports locais correspondentes (`../../contatos/...`, `../../mensagens/...`, `../../design/...`).
3. Importe `UI-UX/Gil/tokens/teamtalk.css` no layout global para disponibilizar os tokens `--tt-*` usados por `conversas.module.css`.
4. Mantenha a barra superior e o rodapé do layout existentes; o componente ocupa a área flexível da página.

## Integrações e limites identificados

- A lista e o início de conversa usam `listarConversasAction` e `listarContatosAction`; abrir histórico, envio, status e tempo real usam as actions e o hook existentes em `src/mensagens/`.
- A tela não cria conversas até que uma mensagem seja enviada. Falhas de envio ficam no histórico local com ação de nova tentativa.
- O contrato atual de `listarConversasAction` converte falhas RPC em lista vazia e `listarMensagensAction` também devolve lista vazia sem expor o erro do Supabase. Por isso, a tela consegue mostrar estados de erro para exceções, mas o estado de erro real do Supabase exige que essas actions retornem os erros.
- O back-end atual não fornece equipes nem favoritos. As abas correspondentes aparecem indisponíveis até existirem os dados e ações necessários.
- A action de envio persiste mensagens de texto. Compartilhamento de PDF não está disponível neste contrato.

Nenhum token, ícone ou componente global foi criado ou alterado.

