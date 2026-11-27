# Arquitetura e execução

O aplicativo Next.js 15 com React 19 está em [DEV/front-end](../DEV/front-end/). O App Router reúne as páginas. As ações de escrita ficam em módulos de domínio e usam o cliente Supabase do servidor. Para reduzir viagens de rede, [as leituras da interface](../DEV/front-end/src/dados/leituras.ts) chamam RPCs a partir do navegador. A aba pode usar uma cópia em `sessionStorage` enquanto atualiza a tela.

| Camada | Local | Responsabilidade |
|---|---|---|
| Interface | `src/app/`, `src/design/` | Rotas, formulários, estados e componentes. |
| Sessão | `src/middleware.ts`, `src/supabase/` | Renovar cookies e verificar a sessão ao navegar. |
| Dados | `DEV/supabase/migracoes/` | Tabelas, funções, políticas e publicação Realtime. |
| Eventos | `src/mensagens/`, `src/push/`, `public/sw.js` | Atualizar conversa aberta e entregar notificações por inscrição. |
| Referências visuais | `UI-UX/` | Pranchas, especificações e decisões de design. |

Siga o [README da raiz](../README.md) para instalar. Os scripts do front são `dev`, `build` e `start`. A CI compila o front com valores de teste. O aceite funcional usa contas e ambiente preparados.
