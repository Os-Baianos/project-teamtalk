# Leituras mais rápidas: direto do navegador para o Supabase

Quem: Ace (Acebmoon)
Data: 2026-11-26

## Por que
Cada leitura (conversas, contatos, mensagens) fazia navegador → Vercel → Supabase, e o middleware ainda consultava o servidor de login em toda requisição. Com as server actions rodando em fila, a tela demorava a abrir.

## O que foi feito
- Leituras agora saem do navegador direto para o Supabase (`src/dados/leituras.ts`). A segurança continua no banco (as funções conferem `auth.uid()`).
- Middleware e envio de mensagem usam `getClaims()` no lugar de `getUser()` (sem ida ao servidor de login quando o projeto usa chaves assimétricas; com a chave antiga cai no `getUser` sozinho).
- Banco: regras de segurança com `(select auth.uid())`, regra redundante de `perfis` removida e 5 índices novos.
- Removidas as server actions antigas de leitura.

## Backup
- Código antigo: branch `backup/antes-otimizacao` (remover quando estiver tudo certo).
- Regras antigas do banco: `DEV/supabase/backup/2026-11-26-politicas-antes-otimizacao.sql`.

## Arquivos criados ou alterados
- DEV/supabase/migracoes/2026-11-26-otimiza-leituras.sql, DEV/supabase/backup/2026-11-26-politicas-antes-otimizacao.sql
- DEV/front-end/src/dados/leituras.ts
- src/mensagens/acoes.ts, src/contatos/acoes.ts, src/supabase/sessao-middleware.ts
- src/app/conversas/page.tsx, src/app/conta/contatos/page.tsx, src/design/componentes/barra-topo.tsx
