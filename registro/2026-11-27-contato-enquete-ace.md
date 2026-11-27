# Contato e Enquete no menu "+"

- Quem: Ace (com Claude)
- Menu "+" ganhou "Contato" e "Enquete" (ícones novos `contato` e `enquete`), nas conversas e nas comunidades.
- Contato: escolhe alguém entre os seus contatos e a conversa recebe um cartão com foto, nome, @ e "Ver perfil".
- Enquete: pergunta, de 2 a 6 opções e opção "Permitir várias respostas". Cada pessoa vota (e troca ou tira o voto), as barras e os totais mudam ao vivo para todos. Quem criou pode encerrar a enquete ou apagar a mensagem (como no WhatsApp). Enquete encerrada não aceita voto.
- Banco (`DEV/supabase/migracoes/2026-11-27-contato-enquete.sql`, já aplicada): `mensagens.contato_ref` e `mensagens.enquete`, tabelas `enquetes`, `enquete_opcoes`, `enquete_votos` (só leitura pelo navegador, quem vê a mensagem vê a enquete) e as funções `enquete_definir`, `enquete_votar`, `enquete_encerrar`. Testado no banco: voto único troca o anterior, encerrada recusa voto.
- Mensagens de contato e enquete não podem ser editadas; a notificação mostra "Contato: Nome" ou "Enquete: pergunta".
