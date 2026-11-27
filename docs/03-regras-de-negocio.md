# Regras da versão atual

- O cadastro normaliza o @ e consulta `arroba_disponivel`. Quando o Supabase cria a conta sem devolver sessão, a tela orienta a confirmar o e-mail.
- A solicitação de contato tem direção. Quem recebe pode aceitar ou recusar. Quem enviou pode cancelar antes da resposta.
- Cada mensagem relaciona remetente e destinatário. O envio remove espaços nas extremidades e aceita de 1 a 2.000 caracteres. Uma resposta guarda a referência à mensagem anterior.
- Limpar a conversa afeta a visualização de quem solicitou. A outra pessoa conserva o histórico.
- O acesso a `/dev` passa pela função `sou_dev`. Ações privilegiadas dependem de funções específicas do banco.

Consulte [dados e funções](06-modelo-de-dados.md) para acompanhar essas regras no SQL.
