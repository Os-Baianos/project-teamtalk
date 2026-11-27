# Aceite da entrega de 4 de dezembro

Use duas contas de teste em sessões independentes e uma terceira conta para verificar privacidade. Registre commit do deploy, ambiente, aparelho, navegador, data, resultado e captura sem dados pessoais. Os cenários abaixo aguardam execução nesta revisão.

| Área | Ação | Evidência esperada |
|---|---|---|
| Sessão | Abrir /conversas sem sessão, entrar e depois sair. | Login na primeira abertura, lista após autenticar e retorno ao login ao sair. |
| Cadastro | Tentar @ em uso e depois um disponível. | Mensagem de indisponibilidade e continuação com @ válido. |
| Contatos | A solicita B. B aceita. Repetir com cancelamento antes do aceite. | Estados coerentes nas duas agendas. |
| Conversa | A envia texto com B fora do chat. B recebe e abre. | Ordem do histórico, contador de não lidas e recibo de leitura coerentes. |
| Resposta e alteração | B responde a uma mensagem. A edita uma mensagem própria. Reabrir a conversa. | Referência de resposta e alteração persistidas. |
| Limpeza e privacidade | A limpa o histórico. B e C consultam suas próprias listas. | B conserva sua conversa. C não vê a troca de A com B. |
| Administração | Abrir /dev com conta comum e com conta dev. | A comum volta às conversas. A autorizada vê a listagem. |
| Push | Ativar no aparelho, conceder permissão e receber mensagem de outra conta com a tela em segundo plano. | Registrar entrega, abertura e comportamento após desativar. |
| Dispositivos | Repetir cadastro e chat no Chrome Android e Safari iPhone. Abrir em desktop. | Registrar resultado por navegador e confrontar acesso desktop com decisão do PO. |

Para o status de PDF, Inbox e provisão pela TI, consulte a [comparação com o piloto](integracao-mvp.md).
