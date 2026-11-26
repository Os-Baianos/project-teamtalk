# Símbolo original do TeamTalk (laranja) em todo lugar

- Quem: Ace (com Claude)
- O quê: o símbolo da barra superior virou o ícone `simbolo` (um só desenho, cores dos tokens do app) e passou a ser usado também na tela de conversa vazia e como favicon (`src/app/icon.svg`).
- Por quê: o símbolo verde da Luana (#187) usa os tokens de `UI-UX/estilos/tokens.css` (verde), mas o app usa laranja. A troca anterior (#210) foi corrigida.
- Obs.: o favicon usa as cores fixas do tema (#ff9900 e #161d26), pois SVG de favicon não lê variáveis CSS.
