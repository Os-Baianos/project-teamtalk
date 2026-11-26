# Conversas no estilo WhatsApp (base para a issue #117)

Quem: Ace (Acebmoon)
Data: 2026-11-26

## O que foi feito
- Tela em duas colunas: conversas à esquerda (pode ocultar) e a conversa à direita. No celular mostra uma coluna por vez.
- Balões maiores, separador de dia, hora e tiques: 1 enviada, 2 cinza recebida, 2 azuis lida.
- Menu em cada mensagem: Dados da mensagem (enviada/recebida/lida), Copiar, Editar e Apagar (as duas últimas só nas minhas).
- Carregando no lugar de "Nenhuma conversa ainda" enquanto a lista e o histórico chegam; animações nas listas, balões, menu e janela.
- Banco: colunas `recebida_em`, `editada_em`, `apagada_em`; funções `marcar_recebidas`, `editar_mensagem`, `apagar_mensagem`; `listar_conversas` agora traz foto e status da última mensagem.
- Tempo real: o remetente vê os tiques mudarem sem recarregar.

## Arquivos criados ou alterados
- DEV/supabase/migracoes/2026-11-26-mensagens-status.sql
- DEV/front-end/src/app/conversas/{page.tsx, tela-conversas.tsx, conversas.module.css}
- DEV/front-end/src/mensagens/{acoes.ts, use-mensagens-ao-vivo.ts}

## Novidades para quem vai usar
Nada novo em tokens ou ícones; usa os ícones enviada, lida, aguardando e falha que já existiam.
