# Issue #117 — módulo isolado de Conversas

Este diretório contém a entrega de interface para revisão e integração posterior. A rota compartilhada em `DEV/front-end/src/app/conversas` permanece intacta. As telas deste módulo recebem dados e callbacks por props para permitir sua ligação às ações existentes de contatos e mensagens.

## Base existente reutilizada

- `listarContatosAction` em `DEV/front-end/src/contatos/acoes.ts` para iniciar conversas com contatos.
- `listarConversasAction`, `listarMensagensAction`, `enviarMensagemAction`, `marcarLidasAction` e `meuIdAction` em `DEV/front-end/src/mensagens/acoes.ts`.
- `useMensagensAoVivo` em `DEV/front-end/src/mensagens/use-mensagens-ao-vivo.ts`.
- Tokens em `UI-UX/Gil/tokens/teamtalk.css` e componentes existentes em `DEV/front-end/src/design/componentes`.

Ao integrar, mova os arquivos `pagina-conversas.tsx`, `tela-conversas.tsx` e `tela-conversas.module.css` para `DEV/front-end/src/app/conversas/`; a rota existente pode renderizar `PaginaConversas`. Ajuste os imports de ações para os caminhos relativos do front-end e importe `UI-UX/Gil/tokens/teamtalk.css` pelo layout global. A tela usa `@design/componentes` e `@design/icones/icone` conforme os aliases existentes.

## Limitação de estado

O modelo fornece `lida_em` e permite distinguir enviada de lida. Não fornece confirmação separada de entrega. O hook Realtime atual escuta somente INSERTs endereçados ao usuário; a atualização de `lida_em` não chega ao remetente ao vivo. O estado lido pode ser exibido quando estiver presente nos dados carregados, mas a atualização ao vivo depende de uma assinatura Realtime de UPDATE no hook compartilhado.

Nenhuma tabela, política, função ou token visual foi criado ou alterado.

O estado de envio é sinalizado pelo estado ocupado do botão. A ação existente não oferece uma fila persistente de mensagens com falha nem uma API de reenvio; por isso, não é apresentado um estado de entrega presumido nem uma opção de reenvio fictícia.

As ações atuais de listagem e histórico retornam arrays vazios quando o Supabase retorna erro sem dados. Para exibir o estado de falha de modo confiável, essas ações precisam propagar erro tipado ao consumidor; o módulo já renderiza os estados de erro quando essa informação estiver disponível.

O contrato atual só contém conversas individuais e contatos, sem metadados de equipe/favoritos; por isso a lista não inventa abas com conteúdo indisponível. O contrato de mensagens também não contempla anexos PDF nem emoji, então o compositor atende somente texto. A inclusão desses recursos depende de definição de Produto/Back-End.
