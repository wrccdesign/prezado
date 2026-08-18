// Função TEMPORÁRIA e somente-leitura: coleta fatos da conta Stripe para
// diagnóstico. Não cria nem altera nada. Pode ser removida depois.
import { createStripeClient } from "../_shared/stripe.ts";

Deno.serve(async () => {
  try {
    const stripe = createStripeClient("live");
    const account = await stripe.accounts.retrieve();
    const prices = await stripe.prices.list({
      lookup_keys: ["profissional_mensal", "escritorio_mensal"],
      expand: ["data.product"],
    });

    return new Response(
      JSON.stringify({
        account: {
          id: account.id,
          country: account.country,
          default_currency: account.default_currency,
          business_name: account.business_profile?.name,
          type: account.business_type,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
        },
        capabilities: account.capabilities,
        prices: prices.data.map((p) => ({
          lookup_key: p.lookup_key,
          currency: p.currency,
          unit_amount: p.unit_amount,
          type: p.type,
          interval: p.recurring?.interval,
          product: typeof p.product === "object" ? (p.product as { name?: string }).name : p.product,
        })),
      }, null, 2),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
