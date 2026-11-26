# Perfil: o usuário pode mudar o próprio nome

Quem: Pedro França Leal (Acebmoon)
Data: 2026-11-26

## O que foi feito
- Na página Perfil, a linha "Nome" ganhou o botão Editar: abre o campo no mesmo lugar, com Salvar e Cancelar.
- A regra é a mesma do cadastro: nome e sobrenome.
- Banco: função `definir_nome` (migração 2026-11-26-perfil-nome.sql). Só altera o perfil de quem está logado e valida o nome de novo no servidor.
- Ação no servidor: `src/app/perfil/acoes.ts`. Componente: `src/app/perfil/editar-nome.tsx`.
- O @ continua sem poder ser trocado pelo próprio usuário.

## Ajuste
- O botão Editar fica centralizado na vertical da linha "Nome".
