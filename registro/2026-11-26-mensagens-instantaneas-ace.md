# Mensagens abrem na hora

Quem: Ace (Acebmoon)
Data: 2026-11-26

## O que foi feito
- As mensagens das 6 conversas mais recentes ficam guardadas na aba (pré-carregadas pela barra do topo). Ao abrir uma conversa, o histórico aparece na hora, sem círculo, e atualiza por trás.
- O histórico aparece assim que chega; marcar como lida e atualizar a lista acontecem depois, sem segurar a tela.
- Excluir conversa ou remover contato limpa a cópia guardada daquela conversa.
- A barra do topo lê o e-mail da sessão local (sem ir ao servidor de login).
- Banco: removidos os dois índices duplicados criados na otimização anterior.

## Arquivos criados ou alterados
- DEV/front-end/src/dados/leituras.ts, src/app/conversas/page.tsx, src/design/componentes/barra-topo.tsx, src/app/perfil/[arroba]/acoes-perfil.tsx
