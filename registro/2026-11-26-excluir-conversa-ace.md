# Excluir conversa (só do meu lado)

Quem: Ace (Acebmoon)
Data: 2026-11-26

## O que foi feito
- Botão "Excluir conversa" no topo do chat, com confirmação. Some só para quem excluiu; a outra pessoa continua vendo. Mensagens novas voltam a aparecer.
- Remover um contato agora também exclui a conversa (só do lado de quem removeu). O botão passou a dizer "Remover e excluir conversa".
- Banco: tabela `conversas_limpas`; funções `limpar_conversa` e `listar_mensagens`; `listar_conversas` e `remover_contato` atualizadas. As mensagens não são apagadas do banco.

## Arquivos criados ou alterados
- DEV/supabase/migracoes/2026-11-26-excluir-conversa.sql
- DEV/front-end/src/mensagens/acoes.ts
- DEV/front-end/src/app/conversas/{page.tsx, tela-conversas.tsx, conversas.module.css}
- DEV/front-end/src/contatos/botoes-relacao.tsx
- DEV/front-end/src/design/componentes/barra-topo.tsx
