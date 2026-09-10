import { getPaymentEnvironmentSafe } from "@/lib/payment-env";

export function PaymentTestModeBanner() {
  const env = getPaymentEnvironmentSafe();

  if (env === "sandbox") {
    return (
      <div className="w-full border-b border-accent/40 bg-accent/10 px-4 py-2 text-center text-sm text-accent-foreground">
        Ambiente de teste: os pagamentos feitos aqui usam cartões de teste e não geram cobrança real.
      </div>
    );
  }

  return null;
}
