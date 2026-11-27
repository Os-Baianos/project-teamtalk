# O que o MVP entrega hoje

Revisão da [main em 27/11/2026](https://github.com/Os-Baianos/project-teamtalk/blob/2c3fe423cef40cd87ac8738ece4f4e7ace14980f/README.md). A implementação permite demonstrar o percurso cadastro → contato → conversa individual. O [PR #110](https://github.com/Os-Baianos/project-teamtalk/pull/110) registra outra versão do aplicativo. Para declarar o piloto corporativo pronto, Produto e QA precisam confrontar a especificação com o fluxo atual e registrar o aceite.

| Tema | Código presente na main | Critério para a entrega |
|---|---|---|
| Entrada | Cadastro público e login por e-mail. A sessão abre `/conversas`. | Confirmar com o PO se o cadastro público atende ao piloto com contas provisionadas pela TI. |
| Dispositivos | O middleware decide por sessão e rota pública. | Validar Android, iPhone e o comportamento esperado em desktop para a entrega. |
| Comunicação | Contatos por @, solicitações, chat individual, tempo real, resposta, edição, exclusão e recibos. | Testar com duas contas e registrar os estados nos dois aparelhos. |
| Arquivos e Inbox | O fluxo de envio em uso recebe texto e uma referência opcional à mensagem respondida. A lista mostra a última mensagem e as não lidas. | PDF privado e organização por colunas, prioridade e favorito pertencem ao escopo anterior. |
| Administração | O painel `/dev` opera sobre usuários por funções do banco. | Provisionamento corporativo, grupos de liberação e auditoria do piloto continuam critérios distintos. |
| Instalação e notificações | Manifesto, service worker, inscrições Web Push e envio no servidor. | Confirmar permissão e entrega real em aparelho com o ambiente configurado. |

A revisão verifica código e SQL versionados. Resultados de aparelho, configuração efetiva do banco, capacidade para 900 pessoas e aprovação do PO precisam de evidência própria.
