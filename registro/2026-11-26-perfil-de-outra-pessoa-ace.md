# Perfil de outra pessoa, busca só por @ e menos carregamento

Quem: Pedro França Leal (Acebmoon)
Data: 2026-11-26

## O que foi feito
- Página nova `/perfil/[arroba]`: mostra foto, nome, @ e "Conta criada em" (sem e-mail). Tem Adicionar/Remover dos contatos e, se já for contato, Conversar (abre `/conversas?com=@usuario`). Se for o próprio perfil, vai para `/perfil`.
- Acesso pelo "Ver perfil" nas sugestões e pela foto/nome no resultado da busca e em "Meus contatos".
- Banco (2026-11-26-ver-perfil.sql): função `ver_perfil`, só para quem está logado.
- A busca de contatos agora é só pelo @ (2026-11-26-sugestoes-so-arroba.sql). Textos da tela sem repetição: título "Adicione pessoas à sua lista", campo "Buscar pessoa", exemplo "@usuario".
- Menos carregamento: saiu o círculo de "Meus contatos", de Conversas, das sugestões e as telas de carregando de Perfil e Painel Dev. O círculo continua só dentro dos botões ocupados.
