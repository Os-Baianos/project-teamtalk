# Handoff — Issue #135: buscar por @ e lista de contatos

**Status:** proposta visual pronta para revisão de Gil e Luana  
**Branch:** `feat/uiux-buscar-contato-135`  
**Prancha:** `references/contatos/busca-e-lista-de-contatos.svg`  
**Referência de implementação:** tokens e componentes em `DEV/front-end/src/design/`

## Entrega

- Prancha vetorial com composição desktop e mobile.
- Busca por @ com resultado e ação de relação.
- Lista “Meus contatos” com ação de remoção e confirmação.
- Estados vazio, carregando, erro de carregamento, falha na busca, @ inexistente e pessoa que já é contato.
- Mensagens e exemplos em português do Brasil.

## Comportamento alinhado ao front-end atual

- Busca automática enquanto digita, a partir de 2 caracteres; exibe até 5 sugestões e permite selecionar uma pessoa.
- A busca exata também pode ser confirmada com Enter. Não desenhar um botão “Buscar” separado: a implementação atual já faz sugestões enquanto digita.
- Para uma pessoa sem relação: **Enviar solicitação**.
- Para solicitação enviada: **Cancelar solicitação**.
- Para solicitação recebida: **Aceitar** e **Recusar**.
- Para contato aceito: **Remover**, com confirmação. A remoção afeta os dois lados.
- Se a pessoa já for contato, não enviar uma segunda solicitação; informar “Essa pessoa já está em Meus contatos.” e manter a ação de remoção disponível.
- Se o identificador não existir: “Nenhum usuário encontrado com @usuario.”
- A lista vazia usa: “Você ainda não tem contatos. Busque alguém por @ para começar.”
- O estado de carregamento reutiliza o componente `Carregando`; falhas mostram texto e ação de tentar novamente.

## Reuso obrigatório do design system

- Barra superior: `DEV/front-end/src/design/componentes/barra-topo.tsx` e CSS existente.
- Campo: `Campo` de `DEV/front-end/src/design/componentes/campo.tsx`.
- Ações: `Botao` de `DEV/front-end/src/design/componentes/botao.tsx`.
- Carregamento: `Carregando` existente.
- Avatar: `DEV/front-end/src/contatos/avatar.tsx`.
- Estados de relação: `BotoesRelacao` de `DEV/front-end/src/contatos/botoes-relacao.tsx`.
- Tokens de implementação: `DEV/front-end/src/design/estilos/tokens.css`.

Cores de referência do front-end: topo `#161D26`, primário `#FF9900`, link/foco `#006CE0`, fundo `#F5F5F5`, texto `#0F141A`. Valores devem continuar vindo dos tokens, não ser duplicados em CSS de tela.

**Não foram criados nem alterados tokens, fontes, espaçamentos globais, ícones, botões, barra superior ou componentes comuns.** A prancha usa representações ilustrativas e não adiciona assets funcionais.

## Responsividade e acessibilidade

- Desktop: busca/resultado e lista em duas colunas.
- Mobile: conteúdo em uma coluna com rolagem natural; manter campo e ações visíveis com teclado aberto.
- Alvos interativos mínimos de 44 × 44 CSS px.
- Texto normal com contraste mínimo de 4,5:1 (WCAG AA).
- Foco visível e ordem lógica de teclado.
- Labels e mensagens textuais; não comunicar estados apenas por cor.
- Campo mobile com fonte mínima de 16 px.
- Respeitar safe areas e `prefers-reduced-motion`.

## Alinhamento com a implementação

Hoje a busca está em `/contatos` e as listas de solicitações/contatos em `/conta/contatos`. A prancha representa a experiência solicitada pela issue #135 em uma composição desktop/mobile; Diego deve alinhar a montagem final dessas áreas sem duplicar a barra superior ou os componentes compartilhados.

A issue de front-end #116 está fechada. A prancha não altera regras de banco, ações ou permissões.

## Critérios de aceite

- [x] Prancha vetorial com desktop e mobile.
- [x] Estados vazio, carregando e erro.
- [x] Mensagens para @ inexistente e contato repetido.
- [x] Lista “Meus contatos” e fluxo de remoção com confirmação.
- [x] Reuso documentado de tokens e componentes existentes.
- [ ] Revisão visual do Gil.
- [ ] Alinhamento/aprovação conjunta de Gil e Luana.
- [ ] Liberação formal para Diego.
