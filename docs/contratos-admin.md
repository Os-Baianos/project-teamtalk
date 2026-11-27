# Gestão de usuários no painel dev

A rota atual é [`/dev`](../DEV/front-end/src/app/dev/page.tsx). A página consulta a conta autenticada e a RPC `sou_dev` antes de carregar usuários. A ausência de sessão leva a `/login`; uma conta comum segue para `/conversas`.

As [ações do painel](../DEV/front-end/src/dev/acoes.ts) incluem listar e editar usuários, excluir conta, trocar senha e liberar troca de @. As verificações de permissão fazem parte das funções do banco. O escopo de grupos e auditoria previsto para o piloto está na [avaliação do MVP](integracao-mvp.md).
