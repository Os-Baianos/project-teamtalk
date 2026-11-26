# Registro de trabalho

Cada trabalho feito (por pessoa ou por IA) vira um arquivo curto nesta pasta. Assim a próxima pessoa ou IA sabe o que já foi feito e de onde continuar. Um arquivo por trabalho evita conflito no Git.

## Nome do arquivo

`AAAA-MM-DD-issue-NUMERO-quem.md`, por exemplo `2026-11-25-issue-135-luana.md`.

## Conteúdo

```
# Issue #NUMERO: título

Quem: nome (GitHub)
Data: AAAA-MM-DD
PR: link

## O que foi feito
- ...

## Arquivos criados ou alterados
- caminho/do/arquivo

## Novidades para quem vai usar
Só para UI-UX: tokens, ícones, componentes, telas ou logos novos ou alterados, e onde estão.
Devs: o que passou a existir ou mudou no código.

## Pendências e dúvidas
- ...
```

## Regra para UI-UX

Tudo que for novo ou mudar em `UI-UX/` (token, ícone, componente, tela, logo) precisa aparecer em "Novidades para quem vai usar". As IAs do front e do back leem esta pasta antes de começar e passam a usar a versão atualizada.
