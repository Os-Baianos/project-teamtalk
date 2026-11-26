# Contatos: sugestões ao digitar e foto de perfil

Quem: Pedro França Leal (Acebmoon)
Data: 2026-11-26

## O que foi feito
- Na busca de Contatos, a partir de 2 letras aparecem até 5 sugestões (foto, nome e @). Tocar numa sugestão escolhe a pessoa. Evita erro de digitação do @.
- A busca é por parte do @ ou do nome, sem diferenciar maiúscula/minúscula nem acento. Não sugere a própria pessoa nem quem já é contato.
- A foto de perfil aparece nas sugestões, no resultado da busca e em "Meus contatos" (sem foto, continua a inicial).
- Banco (migração 2026-11-26-sugestoes-contatos.sql): função `sugerir_perfis` (só para quem está logado) e as funções `buscar_perfil` e `listar_contatos` passaram a devolver `foto_path`. Extensão `unaccent`.
- Front: `src/contatos/acoes.ts` (`sugerirPerfisAction`) e `src/app/contatos/`.

## Ajuste
- Ao tocar em Buscar com um @ incompleto, a tela mostra as pessoas parecidas (as mesmas sugestões) em vez de "Nenhum usuário encontrado". O erro só aparece quando não há nenhuma parecida.
- Itens da lista de sugestões com o mesmo espaçamento em cima e embaixo, foto e texto alinhados no centro.
