# TeamTalk — logo e handoff

Issue: #139

## Arquivos

- `teamtalk-logo-color.svg`: assinatura horizontal colorida, indicada para superfícies claras.
- `teamtalk-logo-monocromatico.svg`: assinatura horizontal branca, indicada para a barra superior e outras superfícies escuras.
- `teamtalk-simbolo.svg`: símbolo isolado para espaços compactos.
- `favicon.svg`: versão simplificada do símbolo para favicon.

## Conceito

O símbolo parte da referência já usada na barra superior: um balão de conversa com a letra “T”. A geometria foi simplificada para manter leitura em tamanhos pequenos e permitir uso como assinatura e ícone. O desenho é original para o TeamTalk e não reproduz marcas de terceiros.

## Cores e tipografia

Os SVGs usam os tokens existentes em `UI-UX/estilos/tokens.css`:

- Verde primário: `#176b5b` (`--cor-primaria`).
- Texto principal: `#173a35` (`--cor-texto`).
- Branco: `#ffffff`, para contraste sobre o verde e fundos escuros.

O wordmark usa uma pilha de fontes de sistema (`ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`), alinhada a `--fonte-familia`. Não há fonte externa nem dependência de arquivo proprietário.

## Fundos e contraste

- Fundo claro: usar `teamtalk-logo-color.svg`.
- Fundo escuro, incluindo a barra superior: usar `teamtalk-logo-monocromatico.svg`.
- Área compacta: usar `teamtalk-simbolo.svg`; para favicon, usar `favicon.svg`.
- Não aplicar a versão colorida diretamente sobre fundo escuro: o wordmark escuro perde contraste.
- Não aplicar a versão branca sobre fundo claro: a assinatura perde legibilidade.

## Tamanho mínimo

- Assinatura horizontal: 130 px de largura.
- Símbolo isolado: 24 × 24 px em interface; abaixo disso, preferir o favicon apenas em contexto de navegador.
- Favicon: 16 × 16 px mínimo; recomendado 32 × 32 px.

## Área de proteção

Manter uma margem livre mínima equivalente a 1/4 da altura do símbolo em todos os lados. Não encostar textos, controles, bordas ou outros elementos nessa área.

## Integridade

- Preservar proporções e viewBox.
- Não esticar, inclinar, rotacionar, adicionar sombras ou contornos.
- Não substituir cores por tons locais: a paleta deve acompanhar os tokens compartilhados.
- Não redesenhar o símbolo nem criar variantes paralelas sem alinhamento entre Gil e Luana.

## Estado da revisão

Entrega inicial para revisão conjunta de UI-UX. Conferir a reprodução em fundos reais do produto, principalmente a barra superior escura, antes da aprovação final.
