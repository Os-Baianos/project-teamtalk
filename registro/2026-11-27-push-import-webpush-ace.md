# Notificações: corrigido erro `setVapidDetails` indefinido

- Quem: Ace (com Claude)
- O quê: nos logs da Vercel, o envio de push falhava com "Cannot read properties of undefined (reading 'setVapidDetails')" — o import padrão de `web-push` vinha vazio no servidor. Criado `src/push/webpush.ts` que aceita as duas formas de import; `enviar.ts` e `acoes.ts` usam ele.
- Efeito: "Enviar teste" e os pushes de mensagem passam a funcionar.
