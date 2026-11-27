# Envio de imagem, PDF e arquivos no chat

- Quem: Ace (com Claude)
- O quê: botão "+" no campo de mensagem para anexar (ou colar uma imagem). Aceita imagem (JPG, PNG, WebP, GIF), PDF, Word, Excel, PowerPoint, TXT, CSV e ZIP, até 10 MB, com legenda opcional.
- Na conversa: imagem aparece na bolha (clique abre); outros arquivos aparecem como cartão com nome e tamanho (clique baixa). Menu da mensagem ganhou "Baixar". Responder, editar a legenda e apagar funcionam; apagar também remove o arquivo.
- Prévia da conversa mostra "Foto" ou o nome do arquivo; a notificação diz "Enviou uma foto" / "Enviou um arquivo: nome".
- Banco (`DEV/supabase/migracoes/2026-11-27-anexos.sql`, já aplicado): colunas `anexo_*` em `mensagens`, bucket privado `anexos` (10 MB), só quem participa da conversa abre o arquivo (link temporário), gatilho que confere dono e tamanho.
- Ao excluir a conta, os arquivos enviados também são removidos.
