# Página Conversas (lista + conversa) e Conta no canto

Quem: Pedro França Leal (Acebmoon)
Data: 2026-11-26
PR: ver PR "Conversas: lista e tela de conversa, Conta no canto da barra"

## O que foi feito
- Nova página /conversas, simples, ligada ao back-end de mensagens (lista de conversas, histórico, envio e tempo real).
- Contatos sem conversa aparecem em "Nova conversa" para começar uma (sem mexer na tela de contatos do Diego).
- Depois do login e do cadastro, o usuário cai em /conversas (antes ia para /contatos).
- Barra superior: aba Conversas; o menu Conta foi para o canto direito da primeira linha, com o e-mail no topo (padrão AWS).

## Arquivos criados ou alterados
- DEV/front-end/src/app/conversas/{page.tsx,tela-conversas.tsx,conversas.module.css}
- DEV/front-end/src/design/componentes/barra-topo.tsx e .module.css
- DEV/front-end/src/middleware.ts, design/telas/login.tsx, app/cadastro/tela-cadastro.tsx, app/dev/page.tsx (destino /conversas)

## Novidades para quem vai usar
- Diego (#116/#117): a tela de contatos dele continua intacta; basta ligar o botão de abrir conversa à rota /conversas se quiser.
- UI-UX (Luana #139): esta tela usa só os componentes e tokens atuais do site, provisória até o desenho oficial.

## Pendências e dúvidas
- Mostrar foto de perfil nas listas.

## Ajuste (menu Conta)
- A caixa do menu Conta agora termina alinhada com a seta do "Conta" (antes passava alguns pixels para a direita).
- Menu Conta padronizado: caixa com fundo sólido (a transparência mostrava cores diferentes ao cruzar a barra), linha do e-mail com a mesma altura das opções, texto suave e cortado com reticências se for longo.
