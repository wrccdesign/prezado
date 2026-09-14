import { getPaymentEnvironmentSafe } from "@/lib/payment-env";

export function PaymentTestModeBanner() {
  if (getPaymentEnvironmentSafe() !== "sandbox") return null;

  return (
    <div className="w-full border-b border-accent/40 bg-accent/10 px-4 py-2 text-center text-note text-accent-foreground">
      Ambiente de teste. As cobranças aqui não são reais.
    </div>
  );
}
