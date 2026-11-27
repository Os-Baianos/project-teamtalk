# Menu da última mensagem cortado

- Quem: Ace (com Claude)
- Bug: ao abrir o menu da última mensagem, ele abria para baixo e ficava escondido atrás da caixa de digitar (o histórico corta o que passa da borda).
- Correção: ao abrir, o histórico rola só o necessário (`scrollIntoView({ block: "nearest" })`) para o menu aparecer inteiro. Vale para o computador e para o celular.
