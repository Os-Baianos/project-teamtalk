# Issue #204: Compartilhamento de arquivos PDF nas conversas

Quem: Diego (diegofgois)
Data: 2026-11-28
PR: não aberto (conforme instrução)

## O que foi feito
- A policy do Storage impede que o atalho de leitura da pasta do remetente exponha PDFs; o objeto PDF só é legível quando sua mensagem está visível pela RLS aos participantes.
- Adicionado envio exclusivo de PDF até 10 MiB usando o bucket privado `anexos` e o registro existente em `mensagens`.
- O endpoint valida extensão, MIME quando informado, tamanho, assinatura, estrutura do PDF e participação na conversa antes de persistir. O endpoint de abertura/download também verifica a autorização pela mensagem antes de recuperar o objeto privado.
- Reutilizados o mecanismo existente de mensagens/RealtIme e os modelos de conversa individual e grupo. O envio usa identificador idempotente para reduzir duplicatas durante tentativas.
- PDFs não expiram junto com anexos temporários de mídia; os demais anexos mantêm a regra atual.
- Criada migração SQL aditiva para restringir inserção de PDFs ao servidor, permitir leitura a participantes e preservar os PDFs no armazenamento. A migração não foi aplicada a um projeto Supabase.
- Testes locais: `npm.cmd test` (7/7 aprovados), `npx.cmd tsc --noEmit` (aprovado), `npm.cmd run build` (aprovado com avisos preexistentes em `src/push/webpush.ts`) e `git diff --check` (aprovado). Não há script lint configurado.

## Arquivos criados ou alterados
- `DEV/front-end/.env.example`
- `DEV/front-end/package.json` e `DEV/front-end/package-lock.json`
- `DEV/front-end/src/app/api/anexos/pdf/route.ts`
- `DEV/front-end/src/app/api/anexos/pdf/[mensagemId]/route.ts`
- `DEV/front-end/src/app/api/limpar-anexos/route.ts`
- `DEV/front-end/src/app/comunidades/page.tsx`
- `DEV/front-end/src/app/conversas/conversas.module.css`
- `DEV/front-end/src/app/conversas/page.tsx`
- `DEV/front-end/src/app/conversas/tela-conversas.tsx`
- `DEV/front-end/src/design/icones/icone.tsx`
- `DEV/front-end/src/grupos/acoes.ts`
- `DEV/front-end/src/mensagens/acoes.ts`
- `DEV/front-end/src/mensagens/anexos.ts`
- `DEV/front-end/src/mensagens/limpar-anexos.ts`
- `DEV/front-end/src/mensagens/pdf-cliente.ts`
- `DEV/front-end/src/mensagens/pdf-constantes.mjs` e `pdf-constantes.d.mts`
- `DEV/front-end/src/mensagens/pdf-validacao.mjs` e `pdf-validacao.d.mts`
- `DEV/front-end/test/pdf-validacao.test.mjs`
- `DEV/supabase/migracoes/2026-11-28-pdf-seguro.sql`

## Novidades para quem vai usar
Na conversa, PDFs aparecem como cartão de documento com nome, tipo e ações de abrir e baixar, além de estado de envio/erro e nova tentativa. O botão `+` e o ícone PDF aprovados existentes foram reutilizados; nenhum token ou arquivo de UI-UX foi criado ou alterado.

## Pendências e dúvidas
- Aplicar e revisar a migração no Supabase antes de habilitar a funcionalidade em produção. Ainda não foram executados testes de integração com contas reais, Realtime e acesso negado de terceiro.
- Configurar e validar a aceitação de requisições de até 10 MiB no projeto Vercel. O build local não valida os limites/configuração do ambiente hospedado.
- Validar manualmente abertura/download, responsividade e recuperação após perda de rede em navegador e ambiente integrado.
- A compilação mantém os avisos existentes sobre a exportação default de `web-push` em `src/push/webpush.ts`.
