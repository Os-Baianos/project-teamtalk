# Serviços e dados

A aplicação usa Supabase Auth, PostgreSQL, Storage e Realtime. As mudanças de banco ficam em [migracoes](../supabase/migracoes/). O código que chama os serviços fica em [front-end/src](../front-end/src/), incluindo Server Actions e leituras feitas pelo navegador.

Consulte o [modelo de dados](../../docs/06-modelo-de-dados.md) para localizar objetos e funções. Para conferir o comportamento instalado, teste cadastro, solicitação de contato e troca de mensagens em duas sessões independentes conforme o [roteiro de aceite](../../docs/08-testes-e-rastreabilidade.md).
