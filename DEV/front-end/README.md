# Aplicativo web

Execute os comandos de instalação do [README da raiz](../../README.md) nesta pasta. `npm run dev` inicia o desenvolvimento, `npm run build` compila e `npm start` serve a compilação.

Em `src/app/` ficam cadastro, login, contatos, conversas, perfis, configurações e painel dev. `src/design/` contém a interface usada pelo aplicativo. As leituras em `src/dados/` chamam o Supabase no navegador. Os módulos `sessao/`, `contatos/`, `mensagens/` e `dev/` reúnem ações de domínio. O service worker em `public/sw.js` participa da entrega de notificações. Veja a [arquitetura](../../docs/05-arquitetura-e-execucao.md).
