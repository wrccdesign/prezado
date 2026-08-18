# Conta Stripe na Irlanda: impacto e ajustes

## Resposta curta

Ter a conta Stripe na Irlanda **não impede** vender no Brasil e **não obriga** cobrar em euros. O que precisa ser ajustado é: moeda dos preços, o que aparece na fatura do cartão e os textos legais/fiscais.

## O que o cliente realmente vê

1. **Moeda**: é definida pelo preço criado no Stripe, não pelo país da conta. Se os preços estiverem em BRL, o checkout mostra R$ 49 / R$ 149. Se estiverem em EUR, aparece em euros. Precisa ser verificado e, se for o caso, recriado em BRL.
2. **Fatura do cartão**: aparece o "statement descriptor" da conta (ex.: HONORIFICO ou WRCC DESIGN), não o país. Mas cobranças por conta estrangeira geralmente entram como **compra internacional**, com **IOF (~4,38%)** e conversão pelo banco do cliente — isso o usuário percebe, mesmo com preço em BRL.
3. **Recibo/e-mail Stripe**: mostra o endereço comercial cadastrado na conta. Se o endereço for irlandês, isso aparece no recibo. Não dá para esconder — é exigência legal do Stripe.

## Pontos que não dá para "esconder"

O endereço da entidade que fatura precisa constar em recibos e nos termos. O que dá para fazer é escolher **qual entidade** fatura e manter tudo coerente.

## Opções

**A. Manter conta Irlanda, cobrar em BRL** (mais rápido)
- Preços em BRL, checkout em português.
- Cliente ainda paga IOF e vê compra internacional na fatura.
- Termos/Reembolso/Privacidade precisam citar a entidade irlandesa como vendedora (não a Wrcc Design/CNPJ), senão fica inconsistente para o Stripe e para o consumidor.
- Sem Pix e sem boleto.

**B. Conta Stripe Brasil (Wrcc Design, CNPJ)** (melhor experiência local)
- Cobrança 100% doméstica: sem IOF, sem "compra internacional", **Pix disponível**.
- Termos já estão escritos com Wrcc Design + CNPJ — bate direitinho.
- Exige abrir/ativar conta Stripe BR com CNPJ e conta bancária brasileira, e refazer o go-live.

**C. Duas contas** — não recomendo agora: dobra a complexidade de webhooks, produtos e ambientes para um volume ainda pequeno.

## Trabalho técnico (independente da opção)

1. **Verificar a moeda atual** dos preços `profissional_mensal` e `escritorio_mensal` no Stripe (consulta via função de leitura ou via `stripe.prices.list`).
2. Se estiverem em EUR: criar novos preços em **BRL** (R$ 49,00 e R$ 149,00/mês) com os mesmos `lookup_key`, arquivando os antigos, para que `create-checkout` e `billing-account` continuem funcionando sem mudar código.
3. Forçar `locale: "pt-BR"` na sessão de checkout em `supabase/functions/create-checkout/index.ts`, para o checkout sair todo em português.
4. Exibir no card do plano em `src/pages/Planos.tsx` a moeda de cobrança confirmada (evita divergência entre o card e o checkout).
5. Se ficar na opção A: ajustar `Termos.tsx`, `Reembolso.tsx`, `Privacidade.tsx` e o rodapé para nomear a entidade irlandesa como vendedora, e avisar no card do plano que a cobrança é internacional (IOF pode incidir).
6. Se for a opção B: manter os textos como estão (Wrcc Design/CNPJ) e refazer produtos, preços e go-live na conta BR.

## Decisão necessária

Preciso saber se você quer seguir com a conta da Irlanda (opção A) ou migrar para uma conta Stripe brasileira com o CNPJ da Wrcc Design (opção B) antes de executar.
