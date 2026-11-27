# Fluxos e estados da interface

| Fluxo | Transições visíveis |
|---|---|
| Sessão | Visitante em rota protegida → login → conversas. Sessão ativa em login ou cadastro → conversas. |
| Contato | Perfil encontrado → solicitação enviada → aceita, recusada ou cancelada. |
| Envio | Texto local → tentativa de envio → confirmação ou falha com possibilidade de tentar novamente. |
| Recibos | Enviada → recebida → lida, conforme as atualizações do destinatário. |
| Histórico | Seleção de contato → carregamento → mensagens, estado vazio ou erro. |

Na conversa aberta, o cliente assina eventos de mensagem e de digitação. A remoção local de um histórico e a ação de apagar uma mensagem têm efeitos diferentes. Veja [regras de negócio](03-regras-de-negocio.md).
