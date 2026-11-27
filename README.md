# TeamTalk

O TeamTalk é um projeto acadêmico de comunicação. Uma pessoa se cadastra com nome, @, e-mail e senha, encontra colegas, troca solicitações de contato e conversa individualmente por texto.

**Estado em 27/11/2026.** O núcleo de mensagens está implementado na `main`. A expressão “MVP integrado” descrevia a versão do PR #110. Para a entrega de 4 de dezembro, a referência é o aplicativo em `DEV/front-end`. A comparação com o piloto corporativo e os critérios que ainda pedem aceite estão na [avaliação do MVP](docs/integracao-mvp.md).

## Executar localmente

Use Node.js 24.x, conforme o manifesto da raiz. A partir da raiz:

```sh
cd DEV/front-end
npm ci
cp .env.example .env.local
```

Em `.env.local`, informe `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` do projeto preparado para o aplicativo. Execute `npm run dev` e abra http://localhost:3000. Para compilar, execute `npm run build` no mesmo diretório.

| Preciso de… | Onde encontrar |
|---|---|
| Fluxos e critérios de aceite | [Casos de uso](docs/04-casos-de-uso.md) e [roteiro de testes](docs/08-testes-e-rastreabilidade.md) |
| Código, dados e deploy | [Arquitetura](docs/05-arquitetura-e-execucao.md), [modelo de dados](docs/06-modelo-de-dados.md) e [homologação](docs/homologacao-vercel-supabase.md) |
| Especificação do PO e decisões pendentes | [Índice da documentação](docs/README.md) |
| Design e colaboração | [UI/UX](UI-UX/README.md), [divisão de tarefas](DIVISAO_TAREFAS.md) e [regras de contribuição](AGENTS.md) |
