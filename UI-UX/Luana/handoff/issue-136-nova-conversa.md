# Handoff — Issue #136: iniciar conversa a partir de contato

**Status:** proposta de prancha para revisão de Gil e Luana  
**Branch:** feat/fluxo-iniciar-conversa-136  
**Fonte visual:** DEV/front-end/src/design/estilos/tokens.css e componentes/ícones existentes em UI-UX/Gil/

## Entrega
- references/nova-conversa/fluxo-iniciar-conversa.svg: prancha vetorial única com fluxo desktop e mobile.
- Três estados em cada breakpoint: lista de conversas; seleção de contato com busca por nome ou @; conversa recém-aberta sem mensagens.

## Comportamento proposto
1. Acionar “Nova conversa” abre a escolha de contato.
2. A busca aceita nome ou identificador @.
3. Selecionar uma linha abre a conversa individual. A abertura não envia mensagem automaticamente.
4. No estado vazio, mostrar “Ainda não há mensagens” e manter o compositor disponível.
5. O retorno leva à etapa anterior sem descartar o rascunho.
6. A primeira mensagem só é enviada após digitação e ação explícita de Enviar.

## Reuso obrigatório
- Ação Nova conversa: UI-UX/Gil/icons/lista-de-conversas/prancha-1/new-conversation.svg.
- Pesquisa: UI-UX/Gil/icons/lista-de-conversas/prancha-1/search.svg.
- Avatares e ícones de conversa: biblioteca existente em UI-UX/Gil/icons/.
- Barra superior, botões, tipografia, espaçamento, cores e foco: tokens existentes; nenhum token novo proposto.
- Tema de implementação: barra #161D26, primário #FF9900, link/foco #006CE0, fundo #F5F5F5 e texto #0F141A.

## Responsividade e acessibilidade
- Desktop: manter navegação e seleção no painel principal, sem criar uma segunda barra superior.
- Mobile: uma etapa por tela, retorno explícito e áreas clicáveis de pelo menos 44 × 44 CSS px.
- Contraste mínimo de 4,5:1 para texto normal; não comunicar estado apenas por cor.
- Foco visível, ordem de teclado previsível e rótulos acessíveis para controles iconográficos.
- Respeitar prefers-reduced-motion.
- Campo mobile com fonte mínima de 16 px para evitar zoom automático no Safari.

## Estados para implementação
- Carregando contatos.
- Busca sem resultado: “Nenhum contato encontrado”.
- Falha ao carregar contatos com ação “Tentar novamente”.
- Contato selecionado e conversa sem histórico.
- Campo vazio: Enviar desabilitado.
- Campo com texto: Enviar habilitado.
- Teclado mobile aberto: compositor visível e viewport rolável.

## Limites
- Não cria token, componente, ícone ou padrão de navegação compartilhado.
- Nomes e avatares da prancha são ilustrativos; usar dados reais do produto.
- A prancha não define regras de backend, permissões, persistência ou notificações.
- Revisão do Gil e alinhamento com Luana são necessários antes de liberar a issue para Diego (#117).

## Critérios de aceite
- [x] Prancha vetorial desktop e mobile criada.
- [x] Reutilização de ícones e componentes existentes documentada.
- [x] Estados de seleção e conversa vazia descritos.
- [x] Diretrizes de acessibilidade e responsividade registradas.
- [ ] Revisão visual do Gil.
- [ ] Aprovação conjunta de Gil e Luana.
- [ ] Liberação formal para Diego (#117).
