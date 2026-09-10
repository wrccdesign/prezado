export type PaymentEnv = "sandbox" | "live";

/**
 * Determina o ambiente de pagamento a partir do hostname.
 * - preview.lovable.app / lovable.app → sandbox
 * - honorifico.com.br / www.honorifico.com.br → live
 * - localhost → sandbox
 */
export function getPaymentEnvironmentSafe(): PaymentEnv {
  if (typeof window === "undefined") return "live";
  const host = window.location.hostname;
  if (host === "localhost" || host.includes("preview.lovable.app") || host.includes("lovable.app")) {
    return "sandbox";
  }
  return "live";
}

export function getPaymentEnvironment(): PaymentEnv {
  return getPaymentEnvironmentSafe();
}
