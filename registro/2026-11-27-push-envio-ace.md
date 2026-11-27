# Notificações: envio corrigido e botão "Teste"

Quem: Ace (com Claude)
Data: 2026-11-27

## O que foi feito
- Causa: o `web-push` 4 não tem exportação padrão; `import webpush from "web-push"` ficava `undefined` e todo envio (teste e mensagens) quebrava no servidor. Agora usa `sendNotification` com `vapidDetails` e limite de 10 s.
- O botão de teste não fica mais carregando para sempre: a tela trata a falha e mostra o aviso.
- "Teste" fica embaixo de "Desativar"; botões do canto com a mesma largura, sem cobrir o texto.

## Arquivos criados ou alterados
- DEV/front-end/src/push/acoes.ts
- DEV/front-end/src/push/enviar.ts
- DEV/front-end/src/app/configuracoes/notificacoes.tsx
- DEV/front-end/src/app/configuracoes/configuracoes.module.css
