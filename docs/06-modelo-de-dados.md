# Dados do aplicativo

| Objeto | Uso no aplicativo |
|---|---|
| Supabase Auth e `public.perfis` | A conta autentica por e-mail e senha. O perfil fornece nome, @, papel e referência à foto. |
| `contatos` e `solicitacoes_contato` | A agenda e as solicitações distinguem quem convida e quem responde. |
| `mensagens` | Cada linha identifica remetente e destinatário, texto, criação, recebimento, leitura e alterações. `responde_a` referencia outra mensagem. |
| `conversas_limpas` | Registra a limpeza do histórico por usuário e interlocutor. |
| `push_assinaturas` | Guarda inscrições dos aparelhos para notificações. |
| Storage `avatares` | A interface resolve a URL da foto do perfil a partir do caminho salvo. |

A lista é derivada das mensagens por `listar_conversas`. O histórico usa `listar_mensagens`. O cliente registra recebimento por `marcar_recebidas` e leitura por `marcar_lidas`. O remetente acompanha alterações via Realtime.

Os [scripts SQL](../DEV/supabase/migracoes/) modificam um esquema que já possui perfis. Para reproduzir em um projeto novo, confirme os pré-requisitos do cadastro, incluindo `arroba_disponivel` e a criação do perfil após o signup. Confira dependências entre scripts da mesma data antes de aplicar. A pasta `backup/` conserva SQL histórico.
