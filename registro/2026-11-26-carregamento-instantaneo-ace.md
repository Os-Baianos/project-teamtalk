# Carregamento instantâneo de Conversas e Contatos

Quem: Ace (Acebmoon)
Data: 2026-11-26

## O que foi feito
- Cache por aba (sessionStorage): Conversas e Meus contatos mostram na hora o que já foi carregado e atualizam por trás. Limpo ao sair da conta.
- Uma chamada só por tela (`carregarInicioAction`, `carregarContaContatosAction`), porque as server actions rodam em fila.
- A barra superior pré-carrega as duas telas depois do login.
- Id do usuário lido da sessão do navegador (sem ir ao servidor).
- `vercel.json` com região pdx1, perto do Supabase (us-west-2).
- Meus contatos ganhou indicador de carregamento.

## Arquivos criados ou alterados
- DEV/front-end/src/cache/cache-local.ts, src/supabase/meu-id.ts, vercel.json
- src/mensagens/acoes.ts, src/contatos/acoes.ts
- src/app/conversas/page.tsx, src/app/conta/contatos/{page.tsx, tela-conta-contatos.tsx}
- src/design/componentes/barra-topo.tsx
