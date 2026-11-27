# Trocar o @ (usuário) com espera de 30 dias

- Quem: Ace (com Claude)
- Perfil: a linha "Usuário (@)" ganhou "Editar". Ao editar aparece um aviso (`Aviso`) dizendo que só dá para trocar de novo daqui a 30 dias, com as mesmas regras do cadastro (`regrasArroba`). Depois de trocar, a linha mostra "Você poderá trocar de novo em dd/mm/aaaa".
- Banco (`DEV/supabase/migracoes/2026-11-27-trocar-arroba.sql`, já aplicada): coluna `perfis.arroba_alterado_em`; `definir_arroba` (ok | invalido | igual | em_uso | aguarde, confere o prazo no servidor); `dev_liberar_troca_arroba` (só DEV/Admin, zera a contagem); `dev_listar_usuarios` agora devolve `arroba_alterado_em`. Ninguém consegue alterar `perfis` direto pelo navegador, então o prazo não dá para burlar.
- Admin: troca o @ de qualquer pessoa pelo "Editar" sem esperar (não gasta o prazo da pessoa). No menu "⋯" aparece "Liberar troca de @" para quem ainda está esperando, e o cartão mostra quando a pessoa trocou e quando poderá trocar de novo.
- Ao trocar o @, o cache da aba é limpo para as listas não mostrarem o @ antigo.
- Testado no banco (rollback): igual, curto, em uso, ok, aguarde, não-admin negado, admin libera e a pessoa troca de novo.
