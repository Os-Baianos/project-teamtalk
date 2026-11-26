# Excluir conversa passa para o perfil da pessoa

Quem: Ace (Acebmoon)
Data: 2026-11-26

## O que foi feito
- O botão "Excluir conversa" saiu do topo do chat e foi para o perfil da pessoa, só quando existe uma conversa visível com ela (não precisa ser contato, como no WhatsApp).
- Pede confirmação ("a conversa some só para você") e, depois de excluir, o botão some.
- Remover o contato esconde o botão, porque a conversa também é excluída.
- Banco: função `tem_conversa(outro)`.

## Arquivos criados ou alterados
- DEV/supabase/migracoes/2026-11-26-excluir-conversa.sql
- DEV/front-end/src/app/perfil/[arroba]/{page.tsx, acoes-perfil.tsx}, src/app/perfil/perfil.module.css
- DEV/front-end/src/app/conversas/{page.tsx, tela-conversas.tsx, conversas.module.css}
