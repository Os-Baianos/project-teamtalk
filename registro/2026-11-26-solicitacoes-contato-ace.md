# Solicitações de contato

Quem: Pedro França Leal (Acebmoon)
Data: 2026-11-26

## O que foi feito
- Adicionar alguém agora envia uma **solicitação**. A outra pessoa aceita ou recusa; quem pediu pode cancelar enquanto estiver pendente. Depois de aceito, qualquer um dos dois pode remover o contato (vale para os dois lados, com confirmação).
- Se as duas pessoas pedirem uma à outra, o contato é aceito na hora.
- Só contatos aceitos trocam mensagens (regra no banco, na política de insert de `mensagens`). Conversas antigas continuam visíveis.
- Página nova **Conta > Contatos** (`/conta/contatos`): Solicitações recebidas, Solicitações enviadas e Meus contatos.
- A busca da aba Contatos mostra o botão certo para cada situação (Enviar solicitação, Cancelar solicitação, Aceitar/Recusar ou Remover). O perfil de outra pessoa tem os mesmos botões, mais Conversar.
- O menu Conta mostra o número de solicitações novas, atualizado em tempo real (e a cada 20 s, para pedidos cancelados do outro lado).

## Banco (migração 2026-11-26-solicitacoes-contato.sql)
- Tabela `solicitacoes_contato` (de_id, para_id). `contatos` guarda só contatos aceitos, sempre nos dois lados.
- Cópia de segurança dos contatos de antes: tabela `contatos_backup_20261126`. Os contatos antigos viraram contatos aceitos nos dois lados.
- Funções: `solicitar_contato`, `aceitar_solicitacao`, `recusar_solicitacao`, `cancelar_solicitacao`, `remover_contato`, `listar_solicitacoes`, `contar_solicitacoes_recebidas`, `relacao_com`. `buscar_perfil`, `sugerir_perfis` e `ver_perfil` passaram a devolver a relação.
- A função `adicionar_contato` foi removida e as tabelas não aceitam mais escrita direta pela API.

## Front
- `src/contatos/` (ações, botões por situação, avatar, tempo real), `src/app/conta/contatos/`, menu em `barra-topo.tsx`.

## Para a documentação (Eliot)
- Contatos agora dependem de solicitação aceita; mensagens só entre contatos aceitos.

## Correção
- A página Conta > Contatos dava erro ("client-side exception"): o menu e a página criavam o canal de tempo real com o mesmo nome. Cada uso agora tem um canal próprio.
