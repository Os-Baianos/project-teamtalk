# Issue #139: Criar o logo original do TeamTalk (sprint 1)

Quem: ChatGPT (OpenAI), em colaboração com Luana
Data: 2026-11-26
PR: https://github.com/Os-Baianos/project-teamtalk/pull/187

## O que foi feito
- Criada uma assinatura horizontal colorida e uma versão monocromática para fundos escuros.
- Criados o símbolo isolado e o favicon em SVG.
- Documentados conceito, paleta, tipografia, tamanhos mínimos, área de proteção e regras de contraste.
- Mantidos os arquivos na raiz compartilhada de `UI-UX/`, sem duplicar nas pastas individuais.

## Arquivos criados ou alterados
- `UI-UX/teamtalk-logo-color.svg`
- `UI-UX/teamtalk-logo-monocromatico.svg`
- `UI-UX/teamtalk-simbolo.svg`
- `UI-UX/favicon.svg`
- `UI-UX/LOGO-HANDOFF.md`
- `registro/2026-11-26-issue-139-chatgpt.md`

## Novidades para quem vai usar
- UI-UX: novos assets oficiais candidatos do TeamTalk em SVG, com versões para fundo claro, fundo escuro, símbolo isolado e favicon. Consultar `UI-UX/LOGO-HANDOFF.md` antes de integrar.
- A versão colorida usa os tokens existentes `--cor-primaria` e `--cor-texto`; nenhuma variável de cor ou fonte foi criada ou alterada.

## Pendências e dúvidas
- Revisão visual obrigatória de Gil e Luana antes da aprovação.
- Conferir os tamanhos mínimos e contraste em dispositivos e fundos reais.
- Após aprovação, o front-end deve integrar o asset adequado na barra superior e no favicon, conforme escopo técnico.
