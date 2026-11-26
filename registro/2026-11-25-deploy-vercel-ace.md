# Deploy do front-end na Vercel

Quem: Ace (Acebmoon), com Claude
Data: 2026-11-25
PR: ver PR da branch `ci/deploy-vercel`

## O que foi feito
- Projeto `project-teamtalk` criado na Vercel (time `teamtalk`), sem ligar o GitHub à Vercel.
- Variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` já configuradas no projeto.
- Workflow `.github/workflows/deploy-vercel.yml`: a cada merge na `main` com mudança em `DEV/front-end/`, faz build e publica pela CLI da Vercel. Sem as credenciais, o job só avisa e não falha.

## Arquivos criados ou alterados
- `.github/workflows/deploy-vercel.yml`

## Novidades para quem vai usar
- Para o deploy funcionar, o repo precisa de: secret `VERCEL_TOKEN` e variables `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` (Settings > Secrets and variables > Actions). O token fica só no GitHub, nunca em arquivo.

## Pendências e dúvidas
- Cadastrar o token e as duas variáveis no GitHub (feito pelo Ace).
- A proteção padrão da Vercel exige login para abrir o site. Decidir se o link deve ser público para a demonstração.
