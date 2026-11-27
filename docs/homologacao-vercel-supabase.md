# Homologação com Vercel e Supabase

1. Identifique o commit do deploy e o projeto Supabase associado. Use contas próprias de teste.
2. Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no front. Confira o cadastro por e-mail e a criação de perfis. Verifique no banco as tabelas, RPCs, Storage e publicação Realtime usados pela versão em teste.
3. Para Web Push, confira no servidor `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT`. Registre o resultado do teste em aparelho, incluindo permissão do navegador.
4. Na Vercel, confirme a raiz `DEV/front-end`. O [workflow](../.github/workflows/deploy-vercel.yml) usa o segredo `VERCEL_TOKEN` e as variáveis `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID`. Ele publica em produção quando acionado e configurado. Se as credenciais faltarem, os passos de build e publicação são pulados.
5. Registre URL, commit e evidências no [roteiro de aceite](08-testes-e-rastreabilidade.md). Consulte o resultado do deploy para identificar qual versão está no ar.
