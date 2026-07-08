# Fase 1.2 — Paywall inteligente no Diagnóstico

Objetivo: usuário free vê valor real (2 cards) antes do paywall; upgrade vira decisão informada, não fricção seca.

## Comportamento

**Usuário free (não pago):**
- Cards **visíveis** (100%): "O que está acontecendo" + "Qual é seu direito"
- Cards **com blur + overlay CTA**: "O que você pode fazer", "Custos/Ganhos", "Onde buscar ajuda", "Sobre a urgência"
- Botões finais (Gerar petição / Falar mais) **desabilitados** com tooltip "Disponível no Profissional"
- Regra especial — **teaser diário**: 1 diagnóstico completo grátis por dia (sem blur). Controlado por `usage_tracking` com nova chave `diagnostico_completo_free`.

**Usuário Profissional/Escritório:**
- Tudo liberado como hoje. Zero mudança visual.

## UX do bloqueio

- Cards bloqueados: `filter: blur(6px)` no conteúdo + overlay centralizado com ícone de cadeado, texto curto ("Continue lendo com Profissional") e botão "Ver planos" → `/planos`.
- Após o último card, banner de conversão sticky: "Este é seu diagnóstico gratuito. Desbloqueie os próximos por R$ X/mês" com CTA primário.
- Copy do teaser diário quando disponível: pequeno badge no topo — "🎁 Seu diagnóstico completo grátis de hoje".

## Mudanças técnicas

### 1. Componente novo: `src/components/PaywallBlur.tsx`
Wrapper reutilizável:
```tsx
<PaywallBlur locked={!isPro && !hasFreeToday}>
  <Card>...</Card>
</PaywallBlur>
```
- Se `locked`, renderiza children com blur + overlay absoluto.
- Overlay: ícone `Lock`, título, subtítulo, botão para `/planos`.
- Aria-hidden no conteúdo bloqueado; overlay focável por teclado.

### 2. `src/pages/Diagnostico.tsx`
- Importar `useSubscription` para saber `isPro`.
- Nova query no início: verificar se usuário já usou seu diagnóstico-completo-grátis hoje (query em `usage_tracking` com `action_type = 'diagnostico_completo_free'` e `date = today`).
- Envolver os 4 cards bloqueáveis em `<PaywallBlur locked={!isPro && !hasFreeToday}>`.
- Quando gera diagnóstico e usuário é free + tem teaser disponível: chamar edge function (ou insert direto) para gravar consumo em `usage_tracking`.
- Botões "Gerar petição" e "Falar mais": desabilitar com tooltip para free bloqueado. Se free + teaser: manter habilitados só nesse dia.
- Banner sticky de conversão abaixo dos cards para free.

### 3. `supabase/functions/diagnostico-juridico/index.ts`
- Nenhuma mudança na IA — o diagnóstico completo continua sendo gerado no backend (para não ter que refazer se usuário fizer upgrade). O bloqueio é 100% visual + de features derivadas (petição/chat).
- Opcional: retornar campo `daily_teaser_available: boolean` para simplificar o front. **Vou incluir** — evita round-trip extra.

### 4. `usage_tracking` (sem migração necessária)
Tabela já existe. Só precisamos usar um novo `action_type = 'diagnostico_completo_free'`. Inserção via service_role na edge function do diagnóstico.

## Detalhes técnicos

- **Bypass de segurança**: como o diagnóstico completo é gerado sempre, tecnicamente o usuário poderia ler via DevTools. **Aceitável para v1** — o objetivo é conversão, não DRM. Se virar problema, na v2 gera-se só os 2 primeiros cards para free.
- **Petição e chat continuam gated no backend** (via `useSubscription` + verificação nas edge functions que já existe). Aqui só adicionamos o bloqueio visual no Diagnóstico.
- **SSR/SEO**: Diagnóstico é rota autenticada, não afeta SEO.

## Arquivos afetados

- Novo: `src/components/PaywallBlur.tsx`
- Editado: `src/pages/Diagnostico.tsx`
- Editado: `supabase/functions/diagnostico-juridico/index.ts` (adicionar `daily_teaser_available` na resposta + insert em `usage_tracking` quando teaser consumido)

## Fora de escopo (fica para depois)

- A/B test de qual card bloquear (v1 = fixo)
- Preços dinâmicos por região no CTA
- Bloqueio server-side dos cards bloqueados

## Como validar

1. Login como free → gerar diagnóstico → ver 2 cards + 4 blurados + banner
2. Segundo diagnóstico no mesmo dia → ver todos blurados (teaser já usado)
3. Login como Profissional → tudo liberado, sem blur, sem banner
4. Botão "Ver planos" navega para `/planos`

Pronto para implementar?
