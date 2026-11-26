# Contas dev e Painel dev

Quem: Pedro França Leal (Acebmoon)
Data: 2026-11-25
PR: ver PR "Contas dev e Painel dev"

## O que foi feito
- Novo papel de conta: `usuario` (padrão) e `dev` (coluna `perfis.papel`). Conta dev **não pode ser criada pelo site**: o cadastro sempre cria `usuario`; o papel dev só se define direto no banco.
- Painel dev em `/dev` (só contas dev): lista todos os usuários (nome, @, e-mail, papel, data de criação no horário de Brasília), filtro, editar nome e @, e excluir conta com confirmação.
- Excluir apaga a conta, os contatos e as mensagens da pessoa. A própria conta dev não pode ser excluída por ali.
- A permissão é conferida no banco em cada ação (funções `dev_listar_usuarios`, `dev_editar_usuario`, `dev_excluir_usuario`); conta comum recebe "negado" e é mandada de volta para `/contatos` se abrir `/dev`.
- Menu Conta mostra "Painel dev" só para contas dev.
- Conta dev inicial: `acebmoon@dev.teamtalk.com`.

## Arquivos criados ou alterados
- DEV/supabase/migracoes/2026-11-25-painel-dev.sql
- DEV/front-end/src/dev/acoes.ts
- DEV/front-end/src/app/dev/ (page, painel-dev, dev.module.css)
- DEV/front-end/src/design/componentes/barra-topo.tsx

## Novidades para quem vai usar
- Para criar outra conta dev: criar a conta normalmente e depois rodar no Supabase `update public.perfis set papel='dev' where id=(select id from auth.users where email='...')`.
- UI-UX: o Painel dev usa só componentes existentes (Campo, Botao, Badge, CabecalhoMobile, LayoutMobile); desenhem se quiserem outra tela.

## Pendências e dúvidas
- Foto de perfil da pessoa excluída continua guardada no Storage (arquivo órfão).
- Trocar senha de outra conta ainda não existe.
