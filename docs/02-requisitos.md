# Requisitos cobertos pela implementação

| Recurso | Comportamento observável | Referência em DEV/front-end/src |
|---|---|---|
| Identidade | Cadastrar com @ disponível, entrar com e-mail e encerrar sessão. | `sessao/acoes.ts`, `middleware.ts` |
| Contatos | Buscar por @, solicitar, aceitar, recusar, cancelar e remover. | `contatos/acoes.ts` |
| Conversas | Listar por atividade, mostrar não lidas e abrir histórico individual. | `dados/leituras.ts`, `app/conversas/` |
| Mensagens | Enviar até 2.000 caracteres, responder, editar e apagar. | `mensagens/acoes.ts` |
| Perfil e conta | Editar nome, @ e foto, trocar senha e excluir a própria conta. | `app/perfil/`, `configuracoes/acoes.ts` |
| Operação | Gerir usuários com papel dev e configurar notificações por aparelho. | `dev/acoes.ts`, `push/` |

Os identificadores RF e RNF do [documento do PO](Documento-de-Requisitos.md) continuam associados à proposta original. Consulte o [roteiro de aceite](08-testes-e-rastreabilidade.md) para verificar a versão atual.
