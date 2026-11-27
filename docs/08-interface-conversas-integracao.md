# Integração da tela de conversas

A página `/conversas` combina resumos, contatos e histórico. [A página](../DEV/front-end/src/app/conversas/page.tsx) carrega o estado, acompanha o contato selecionado e trata o envio. [A tela](../DEV/front-end/src/app/conversas/tela-conversas.tsx) apresenta os balões e ações. Ao chegar do perfil com `?com=@usuario`, o cliente procura a pessoa entre conversas e contatos.

`lerInicio` reúne conversas e contatos e marca recebimentos. Ao abrir o histórico, o cliente consulta `listar_mensagens`. Eventos Realtime atualizam a lista e as mensagens. Veja [estados](07-fluxos-e-estados.md) e [cenários com duas contas](08-testes-e-rastreabilidade.md).
