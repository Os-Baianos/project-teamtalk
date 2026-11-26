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
