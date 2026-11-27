# Notificações: botão "Enviar teste" e diagnóstico

- Quem: Ace (com Claude)
- Problema: a pessoa aceitou a permissão, mas as notificações não chegavam; a tabela `push_assinaturas` estava vazia (nenhum aparelho registrado ou o registro foi apagado).
- Configurações → Notificações ganhou "Enviar teste" (`enviarPushTesteAction`): manda uma notificação para os aparelhos da própria conta e mostra na tela o que aconteceu (sem aparelho registrado, expirado, falha do serviço de push). O teste aparece mesmo com o app aberto (`forcar` no `sw.js`); as mensagens normais continuam sem notificar com o app aberto e à vista.
- O envio das mensagens agora registra erros no log do servidor (`console.error` em `src/push/enviar.ts`).
