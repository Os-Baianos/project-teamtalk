# Contrato atual de autenticação

As rotas públicas são `/login` e `/cadastro`. O [middleware](../DEV/front-end/src/middleware.ts) renova os cookies e verifica claims da sessão. Uma requisição de página protegida sem sessão é redirecionada ao login. Uma sessão válida em rota pública segue para `/conversas`.

O formulário chama `entrarAction` com e-mail e senha. `cadastrarAction` consulta a disponibilidade do @ e chama `signUp` com nome e @ nos metadados. Se o serviço exigir confirmação de e-mail, a conta pode ser criada antes de a sessão existir. `sairAction` encerra a sessão e pode remover a inscrição push do aparelho.

O [documento do PO](Documento-de-Requisitos.md) descreve credencial inicial entregue pela TI. O aceite desse requisito segue a [avaliação do MVP](integracao-mvp.md).
