

## Preservar contexto do Diagnóstico ao continuar no Chat

### Problema
Ao clicar "Falar mais sobre isso" no Diagnóstico, o usuário é levado ao Chat mas perde toda a conversa anterior. O `navigate` envia `state.initialMessage`, porém o Chat.tsx nunca lê esse state.

### Solução recomendada: Passar contexto completo e auto-enviar

Em vez de apenas enviar uma mensagem genérica, passar o diagnóstico completo como contexto inicial do chat, permitindo que a IA continue a conversa com conhecimento do que já foi discutido.

### Mudanças

**1. `src/pages/Diagnostico.tsx` — Enviar contexto rico**
- Alterar `handleChatMore` para passar tanto a situação original quanto o resultado do diagnóstico via `navigate state`
- Incluir um resumo formatado do diagnóstico como primeira mensagem "assistant" para o usuário ver o que já foi discutido

**2. `src/pages/Chat.tsx` — Ler o state e pré-popular conversa**
- Usar `useLocation()` para ler `location.state`
- Se vier `fromDiagnostico: true`, pré-popular o array `messages` com:
  - Uma mensagem `user` com a situação original
  - Uma mensagem `assistant` com um resumo do diagnóstico
- Auto-enviar a pergunta de follow-up se houver `initialMessage`
- Limpar o state após consumir (via `navigate(location.pathname, { replace: true, state: null })`) para evitar re-trigger em refresh

**3. Fluxo resultante**
```text
Diagnóstico → clica "Falar mais" → Chat abre com:
  [user]: "Fui demitido sem receber..."
  [assistant]: "Resumo do diagnóstico: ..."
  [user pode continuar perguntando normalmente]
```

Dessa forma o usuário mantém o contexto visual e a IA recebe o histórico completo para dar respostas coerentes. Não é necessário salvar em banco — o contexto viaja via navigation state e é suficiente para a sessão.

