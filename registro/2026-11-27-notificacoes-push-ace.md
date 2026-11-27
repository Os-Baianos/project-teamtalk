# Notificações push (nome e foto de quem mandou)

- Quem: Ace (com Claude)
- O quê: quem recebe uma mensagem ganha uma notificação no celular/computador, mesmo com o app fechado. Título = nome de quem mandou, texto = mensagem (até 140 caracteres), ícone = foto de perfil (ou o símbolo laranja). Tocar abre a conversa (`/conversas?com=@usuario`).
- Perfil: nova linha "Notificações" com Ativar/Desativar (o navegador pede a permissão uma vez). No iPhone só funciona com o app instalado na tela inicial (iOS 16.4+).
- Banco (`DEV/supabase/migracoes/2026-11-27-notificacoes-push.sql`, já aplicada): tabela `push_assinaturas` (RLS: cada pessoa vê/cria/apaga só as suas) e as funções `push_destinos` / `push_remover_morto`, que só deixam ler os aparelhos de quem acabou de receber uma mensagem de você (menos de 1 min).
- Servidor: `src/push/enviar.ts` (biblioteca `web-push`) roda com `after()` depois de gravar a mensagem, sem atrasar o envio. Aparelho cancelado (404/410) é apagado sozinho.
- Service worker (`public/sw.js`): recebe o push, mostra a notificação e abre a conversa no toque. Se o app já está aberto e à vista, não notifica (o tempo real já mostra).
- Chaves VAPID (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`) cadastradas na Vercel (a privada como variável criptografada, nunca no repositório).
- Sair da conta apaga o registro do aparelho (campo escondido `endpoint` no formulário de logout), para não chegar notificação de uma conta que saiu.
- Backup antes da mudança: branch `backup/antes-push`.
