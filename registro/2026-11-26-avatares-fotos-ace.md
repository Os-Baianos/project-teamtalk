# Avatares predefinidos: fotos de animais e flores (estilo Mac)

Quem: Pedro França Leal (Acebmoon)
Data: 2026-11-26
PR: ver PR "Avatares: fotos de animais e flores no estilo do Mac"

## O que foi feito
- Os 12 avatares desenhados foram trocados por 12 fotos de animais e flores, no estilo das imagens padrão de perfil do Mac.
- Fotos redimensionadas para 256x256 e guardadas em DEV/front-end/public/avatares (cerca de 200 KB no total).
- Seletor do perfil continua igual; só a origem das imagens mudou.

## Origem e licença
Todas do Wikimedia Commons, na categoria CC-Zero (CC0, domínio público), sem exigir crédito:
- aguia: File:Bald Eagle Yukon.jpg
- arara: File:Ara ararauna portrait Rhodes.jpg
- coruja: File:Eurasian eagle-owl, Almaty 01.jpg
- tigre: File:A Bengal tigress (Panthera tigris tigris) in syphon area of Pilibhit tiger reserve.jpg
- zebra: File:Zebra-stripes-black-and-white-zoo-39245.jpg
- pinguim: File:Portrait of an African penguin searching food.jpg
- girassol: File:Sončnica - Sunflower - Helianthus annuus (1).JPG
- rosa: File:Colombian red rose in garden.jpg
- lotus: File:Lotus flower (978659).jpg
- papoula: File:Papaver rhoeas -- corn poppy.jpg
- dente-de-leao: File:Pissenlit (taraxacum) 02.jpg
- joaninha: File:Ladybug eating aphids. (49485764276).jpg

## Arquivos alterados
- DEV/front-end/src/app/perfil/avatares-predefinidos.ts
- DEV/front-end/public/avatares/*.jpg (novos)

## Pendências e dúvidas
- Provisórios até o UI-UX oficial. Trocar uma foto é só substituir o arquivo em public/avatares.
