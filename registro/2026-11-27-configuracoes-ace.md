# Página Configurações

- Quem: Ace (com Claude)
- O quê: nova página `/configuracoes` (menu Conta → Configurações, entre Contatos e Admin) com três linhas no mesmo visual do Perfil: Notificações, Senha e Excluir conta.
- Notificações: a linha Ativar/Desativar saiu do Perfil e veio para cá (`src/app/configuracoes/notificacoes.tsx`).
- Senha: troca no mesmo lugar, pede a senha atual e segue as regras do cadastro (`ListaRegras`); confere a atual entrando de novo antes de trocar (`trocarMinhaSenhaAction`).
- Excluir conta: aviso (`Aviso`) de que não dá para desfazer + senha para confirmar; apaga fotos, conta e, em cascata, perfil, contatos, mensagens e aparelhos de notificação. Contas Admin não saem por aqui (`excluirMinhaContaAction`).
- Banco (`DEV/supabase/migracoes/2026-11-27-excluir-minha-conta.sql`, já aplicada): função `excluir_minha_conta`.
- Animações no padrão do site (entrada suave das linhas, formulários que aparecem, `prefers-reduced-motion` respeitado).
