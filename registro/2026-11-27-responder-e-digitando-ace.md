# Responder mensagem e "digitando…"

- Quem: Ace (com Claude)
- Responder: no menu da mensagem (setinha no computador, segurar no celular) entrou "Responder". A barra "Você / nome + texto" aparece acima da caixa de digitar (X ou Esc cancela). A mensagem enviada mostra a citação no topo do balão; clicar nela rola até a original e a destaca. Se a original foi apagada/excluída aparece "Mensagem indisponível".
- Banco (`DEV/supabase/migracoes/2026-11-27-responder-mensagem.sql`, já aplicada): coluna `mensagens.responde_a` (FK, vira null se a original sumir) e um gatilho que só aceita responder a mensagem da mesma conversa (senão ignora).
- Digitando: `src/mensagens/use-digitando.ts` usa um canal de broadcast temporário do Realtime só da dupla (nada é gravado no banco). Aparece "digitando…" no cabeçalho do chat e na prévia da lista, some após ~4 s sem digitar, ao enviar ou quando a mensagem dela chega.
- Obs.: o canal de "digitando" é público por nome (id da dupla); só carrega o aviso de que alguém está digitando.
