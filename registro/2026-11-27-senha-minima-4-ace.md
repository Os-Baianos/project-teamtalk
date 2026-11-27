# Senha só com mínimo de 4 caracteres

- Quem: Ace (com Claude)
- O quê: a senha agora só precisa ter de 4 a 72 caracteres (72 é o limite do bcrypt). Saíram as exigências de maiúscula, minúscula, número e símbolo.
- Avisos: removidas as listas de regras e o texto de ajuda dos campos de senha (cadastro, Configurações e painel Admin).
- Banco (`DEV/supabase/migracoes/2026-11-27-senha-minima-4.sql`, já aplicado): `dev_trocar_senha` com a nova regra e nova `trocar_minha_senha`, usada em Configurações porque o mínimo do Auth do Supabase não dá para baixar por código. Também tirei a permissão de chamar a função de gatilho `mensagens_valida_anexo` pela API.
- Atenção: no cadastro, o Auth do Supabase ainda pode exigir o mínimo dele (padrão 6). Para valer 4 também lá, ajustar "Minimum password length" em Authentication no painel do Supabase.
