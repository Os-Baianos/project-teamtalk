# Regras para IAs e pessoas do projeto TeamTalk

Valem para quem trabalha em qualquer parte: front-end, back-end e UI-UX. Se você é uma IA, siga este arquivo do começo ao fim.

## Antes de começar

1. Leia a issue inteira (descrição, critérios de aceite, dependências).
2. Leia `registro/`, começando pelos arquivos mais recentes, para saber o que os outros já fizeram.
3. Leia a pasta `UI-UX/` (`README.md`, `Gil/`, `Luana/` e os arquivos comuns). Ela é a fonte do visual.
4. Atualize a branch: `git pull` da `main`.

## Durante o trabalho

- Uma branch por issue, com nome `feat/...`, `fix/...` ou `docs/...`.
- Dev (front e back) usa só o que existe em `UI-UX/`: tokens, componentes, ícones, textos e estados. Não crie cor, fonte, ícone, logo nem componente por conta própria. Se faltar algo, comente na issue e peça para a UI-UX.
- Se a UI-UX atualizou algo, use a versão mais nova.
- UI-UX (Gil e Luana) mantém um único conjunto de tokens para as duas pastas. Nada de barra superior, cor, fonte, botão ou ícone paralelos. Mudança em token ou componente comum só entra com os dois de acordo.
- Não mexa na documentação do PO (`docs/`) sem a issue pedir.
- Nunca coloque senha, chave ou token em arquivo, commit ou issue.
- Commits curtos, sobre o que mudou, em português.

## Ao terminar

1. Abra um PR com `Closes #número` na descrição.
2. Crie um registro em `registro/` (formato em `registro/README.md`).
3. Ninguém dá merge no próprio PR. Mudança em `UI-UX/` precisa do Gil e da Luana revisando, e mudança no front, do Ace.
