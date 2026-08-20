import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";

interface StripeEmbeddedCheckoutProps {
  priceId: string;
  returnUrl?: string;
}

export function StripeEmbeddedCheckout({ priceId, returnUrl }: StripeEmbeddedCheckoutProps) {
  const fetchClientSecret = async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId, returnUrl, environment: getStripeEnvironment() },
    });
    if (error || !data?.clientSecret) {
      throw new Error(data?.error || error?.message || "Não foi possível iniciar o checkout");
    }
    return data.clientSecret as string;
  };

  const isAnnual = priceId.endsWith("_anual");

  return (
    <div id="checkout">
      {isAnnual && (
        <div className="mb-4 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          Pagamento único de 12 meses, no cartão. O acesso é liberado assim que o pagamento é confirmado.
        </div>
      )}

      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}

