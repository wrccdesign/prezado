# Coerência da vitrine + ponte do gratuito para o pago

## Bloco A — remoções e correções de texto

**A1 — Logo personalizado.** Varredura feita. A única promessa na vitrine está no card Escritório da landing (`plans[2].features`: "Logo personalizado"). Será trocada por um benefício real conferido no `rate-limit.ts`: **"300 leituras/OCR de documentos por mês"** (escritório: `documento: 300`, contra 80 no Profissional). Nenhuma menção a white label / marca própria existe em `/planos`, `/comparativo`, `llms.txt` ou metadados.

Aviso (não vou alterar sem sua ordem): o painel do advogado **tem** upload de logo implementado — `SettingsTab.tsx` faz upload para o bucket `office-logos` e o `PlanGate` descreve "Logo personalizado nas petições". Se o logo não é aplicado de fato nas petições geradas, esse texto do painel também é uma promessa não cumprida. Me diga se quer que eu remova/ajuste essa tela ou deixe como está.

**A2 — Pix.**
- Landing: `annualNote` dos dois planos passa de "à vista no Pix" para "à vista no cartão".
- `/planos`: "Pagamento único de 12 meses, à vista no cartão. Sem renovação automática."
- `create-checkout/index.ts` (linha 186): `payment_method_types: ["card"]`, com comentário registrando que o Pix volta quando houver conta Stripe BR. Fluxo anual e cupom de crédito proporcional intactos.
- O aviso de processamento internacional / IOF permanece.

**A3 — Rodapé.** Texto legal reescrito no eixo atual: "Honorífico — cálculos e prazos jurídicos com fonte oficial, com memória de cálculo em PDF e Word. Pagamentos processados com segurança pela Stripe."

**A4 — CTA do Escritório.** "Falar com Vendas" → "Assinar Escritório" (destino `/planos` mantido).

**A5 — Busca pública de decisões.** Em `/planos` a linha vira "Consulta pública de andamentos e decisões publicadas", alinhada ao vocabulário da linha acima. (Não removo: a linha acima é sobre cota mensal; esta é sobre acesso, presente nos três planos.)

**A6 — Teste de 7 dias na landing.** Confirmado no `handle_new_user`: 7 dias, tier `profissional`, `access_type = 'trial'`. Duas inserções discretas:
- Sob o CTA do hero: "Conta nova começa com 7 dias no plano Profissional, sem cartão."
- Na abertura da seção Planos, a mesma informação em uma linha.

## Bloco B — ponte do cálculo para a petição

**B1/B4.** Na landing, o `CorrecaoCalc` embutido passa a receber `onUsarValor`, com `usarValorLabel = "Gerar petição com este valor"`. O botão é renderizado na mesma linha dos exports, mas com `variant="ghost"` (hoje é sólido/primário) para não competir com Exportar PDF/Word — pequeno ajuste no `CorrecaoCalc` para aceitar a variante via prop, sem mudar o comportamento do `CustasCalc`.

**B2 — estados do usuário.** O handler navega para `/peticao` com `state: { valorCorrigido, periodo, indice }`.
- Anônimo: `ProtectedRoute` já redireciona para `/auth` com `redirectTo`. Hoje **só o path sobrevive** — o `state` do cálculo se perde. Correção: persistir o payload em `sessionStorage` (`honorifico:peticao-prefill`) antes de navegar, e o `/peticao` lê de `location.state` **ou** do `sessionStorage`, consumindo a chave depois. Assim o valor sobrevive ao login.
- Trial ou plano pago: entra direto com o campo pré-preenchido.
- Free com `peticao: 0`: nada muda no bloqueio — a mensagem de cota do `rate-limit.ts` continua sendo exibida pelo fluxo atual, e o valor permanece no `sessionStorage`/formulário, sem perda.

**B3 — impacto em `/peticao`.** Nenhuma refatoração do gerador. O único acréscimo é um `useEffect` que, havendo prefill, insere uma linha no campo **Pedidos** ("Valor atualizado: R$ X (período MM/AAAA a MM/AAAA, índice IPCA)"). Formulário, prompt e edge function ficam idênticos.

## Fora do escopo
Preços, cotas, lógica de cálculo e autenticação permanecem intocados. Nenhum benefício novo inventado.
