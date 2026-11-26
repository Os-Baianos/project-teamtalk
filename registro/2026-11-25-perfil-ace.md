# Aba Perfil

Quem: Pedro França Leal (Acebmoon)
Data: 2026-11-25
PR: ver PR "Aba Perfil na Conta"

## O que foi feito
- Nova página `/perfil` (só logado): bolinha com a inicial do nome, nome, @, e-mail e data de criação da conta.
- Item "Perfil" no menu Conta, acima do Sair.
- Supabase: cada pessoa pode ler o próprio perfil (política `perfis_ver_o_proprio`). Antes a tabela não tinha leitura liberada.

## Arquivos criados ou alterados
- DEV/front-end/src/app/perfil/page.tsx e perfil.module.css
- DEV/front-end/src/design/componentes/barra-topo.tsx
- DEV/supabase/migracoes/2026-11-25-perfis-leitura.sql

## Novidades para quem vai usar
- UI-UX (#134 Gil, #135 Luana): a tela de Perfil usa só tokens e componentes existentes. A "foto" é a inicial em círculo, igual ao avatar dos contatos; ainda não há envio de foto nem prancha de Perfil em UI-UX. Se quiserem desenhar, avisem.

## Pendências e dúvidas
- Foto de perfil de verdade (envio de imagem) ainda não existe.

## Foto de perfil e visual do menu Conta
- Na página Perfil: enviar foto, ajustar (arrastar e zoom) e remover. A foto final é um quadrado de 256 px em JPEG, mostrado em círculo.
- Supabase: bucket público `avatares` (cada pessoa mexe só na própria pasta, máx. 2 MB), coluna `perfis.foto_path` e função `definir_foto`.
- Menu Conta no estilo das listas da AWS: caixa de cantos arredondados, fundo levemente transparente com desfoque, divisórias entre os itens e seleção que acompanha a borda.
- Arquivos: `src/app/perfil/foto-perfil.tsx`, `perfil.module.css`, `page.tsx`, `barra-topo.module.css`, `DEV/supabase/migracoes/2026-11-25-foto-perfil.sql`.
- Pendência: mostrar a foto também nos contatos e conversas (depende das telas de #116 e #117).

## Menu da foto e fotos predefinidas
- O botão grande "Enviar foto" saiu. Agora a foto tem um botão pequeno "Editar" no canto, que abre um menu: Escolher foto…, Enviar foto… e Remover foto.
- "Escolher foto…" abre uma grade no estilo do seletor do macOS, com 12 imagens predefinidas; escolhe, clica em Salvar foto.
- Exceção pedida pelo Ace: as 12 imagens são formas simples criadas em código (`src/app/perfil/avatares-predefinidos.ts`), pois não existem imagens em UI-UX. UI-UX (#132 a #139) pode substituir por um conjunto oficial, trocando só esse arquivo.
- O botão "Editar" usa só texto, sem ícone novo.
