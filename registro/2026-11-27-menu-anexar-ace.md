# Menu "+" do chat, vídeo e limite de 50 MB

- Quem: Ace (com Claude)
- O quê: o "+" do campo de mensagem abre o menu escuro do projeto (`MenuAcoes`, agora com `gatilho`, `paraCima` e `icone` opcionais) com Documento, Fotos e vídeos e Câmera. Ícones novos de traço: `documento`, `foto-video`, `camera`. Contato e Enquete entram no próximo PR.
- Vídeo (MP4, WebM, MOV) agora é aceito e toca na bolha. Limite por arquivo: 50 MB (máximo do plano Free do Supabase). Acima disso aparece "Limite de tamanho ultrapassado".
- Expiração: arquivos duram 7 dias. Depois ninguém abre (regra no banco), o app de quem enviou apaga o arquivo ao abrir as conversas e a limpeza diária do servidor (`/api/limpar-anexos`, Vercel Cron, 05:00 UTC) apaga o resto. A mensagem passa a mostrar "Arquivo expirado".
- Banco (`DEV/supabase/migracoes/2026-11-27-anexos-50mb-expiracao.sql`, já aplicado).
- Pendente: para a limpeza do servidor funcionar, colocar `SUPABASE_SERVICE_ROLE_KEY` nas variáveis do Vercel (o `CRON_SECRET` já foi criado).
