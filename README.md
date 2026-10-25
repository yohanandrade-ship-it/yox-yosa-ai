# YOX YOSA AI

Chat web em português com interface responsiva e função serverless Netlify para OpenRouter.

## Arquivos
- `index.html`: interface do chat
- `script.js`: interações do navegador
- `netlify/functions/chat.js`: chamada segura à API OpenRouter no servidor
- `netlify.toml`: configuração de build e funções

## Publicar
1. Envie todos os arquivos e pastas deste projeto para a raiz do repositório GitHub.
2. No Netlify, conecte o repositório `yox-yosa-ai` (ou abra as configurações do site já existente).
3. Em **Site configuration / Environment variables** (ou **Project configuration / Environment variables**), crie `OPENROUTER_API_KEY` com sua chave secreta válida da OpenRouter.
4. Salve e faça um novo deploy. Nunca coloque a chave em `script.js`, `index.html`, GitHub ou em mensagens públicas.
5. Abra o site publicado e envie uma mensagem de teste.

Opcional: configure `OPENROUTER_MODEL` como `openai/gpt-4o` se quiser definir explicitamente o modelo. O modelo pode exigir créditos e acesso na OpenRouter.

## Erros comuns
- `OPENROUTER_API_KEY ainda não foi configurada`: a variável não foi adicionada ao ambiente do site Netlify.
- `OpenRouter recusou a chave`: crie uma chave válida no painel OpenRouter, confira créditos/permissões e atualize a variável no Netlify.
- Depois de mudar variáveis, faça um novo deploy para que a função receba os valores atualizados.

O projeto não salva histórico em uma conta: as mensagens ficam na memória da página enquanto ela estiver aberta.