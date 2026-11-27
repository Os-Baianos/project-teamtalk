# Celular: segurar a mensagem e instalar o app

- Quem: Ace (com Claude)
- Conversas: no celular a setinha de cada mensagem some; segura a mensagem (~0,5 s) para abrir o menu (Dados da mensagem, Copiar, Editar, Apagar), que cai logo abaixo do balão. No computador continua a setinha (e o botão direito também abre). O menu aberto fica acima das setinhas das outras mensagens (z-index) e o toque que abre não fecha na sequência.
- Instalar app: o `manifest.webmanifest` estava sendo redirecionado para o login pelo middleware, por isso o Chrome dizia "Não é possível instalar o app". Agora ele fica fora da proteção. Também entrou um service worker mínimo (`public/sw.js`, sem cache/offline) registrado em `src/pwa/registrar-sw.tsx`, que o Chrome do Android costuma exigir.
