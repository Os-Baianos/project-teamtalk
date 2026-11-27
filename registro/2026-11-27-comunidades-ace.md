# Comunidades (grupos)

- Quem: Ace (com Claude)
- Nova aba "Comunidades" depois de "Contatos" na barra do topo e no menu do celular. A tela reaproveita a de Conversas (`TelaConversas` ganhou o modo `grupo`): cada mensagem dos outros mostra foto e nome de quem escreveu, responder, editar, apagar, anexos e notificação funcionam como nas conversas. Os tiques são só "enviada" e "lida por todos".
- Só Admin/DEV cria grupo, no painel Admin (nova seção "Comunidades": nome, chat aberto ou só admins, escolha dos membros, lista com excluir).
- Tocar no topo do grupo abre "Informações do grupo": foto, nome, regra do chat, membros. Admin edita nome e foto, muda a regra, adiciona e remove membros e exclui o grupo. Qualquer membro pode sair.
- Chat fechado: só Admin/DEV que estão no grupo escrevem; os outros veem a barra "Somente admins podem enviar mensagens". Avisos centralizados no estilo do WhatsApp (criou, adicionou, removeu, saiu, mudou nome, foto ou regra).
- Quem sai ou é removido perde o histórico; quem entra depois só vê as mensagens a partir da entrada.
- Banco (`DEV/supabase/migracoes/2026-11-27-comunidades.sql`, já aplicada): `grupos`, `grupo_membros`, mensagens com `grupo_id` e `sistema`, regras de acesso e as funções `grupo_*`. As conversas 1:1 continuam iguais.
- Notificação do grupo: título é o nome do grupo e o texto "Fulano: mensagem" (`enviarPushDoGrupo`).
- Fica para depois: "Contato" e "Enquete" do menu "+", aviso de "digitando" em grupo.
