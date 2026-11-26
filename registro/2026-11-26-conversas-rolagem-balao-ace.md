# Conversas: a página não desce sozinha e a hora entra na linha do texto

Quem: Ace (Acebmoon)
Data: 2026-11-26

## O que foi feito
- A tela de Conversas ocupa a janela e só a lista e o histórico rolam. Antes a página inteira passava da altura e `scrollIntoView` puxava o navegador para baixo a cada mensagem enviada.
- O histórico rola só a própria caixa até o fim (e ao enviar acompanha a mensagem). Se a pessoa subiu para ler, não puxa de volta.
- Hora e tiques entram na mesma linha do texto quando cabem (como no WhatsApp), então "oi" fica com balão justo.

## Arquivos criados ou alterados
- DEV/front-end/src/app/conversas/{tela-conversas.tsx, conversas.module.css}
- DEV/front-end/src/design/estilos.css (classe `pagina-cheia`)
