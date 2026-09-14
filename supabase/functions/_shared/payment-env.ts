export type PaymentEnv = "sandbox" | "live";

/**
 * Regra única de ambiente de pagamento, espelhada em src/lib/payment-env.ts.
 *
 * O ambiente NUNCA vem de header do cliente: é derivado do Origin/Referer.
 * Host desconhecido é sempre tratado como produção.
 */
export function classifyHost(rawHost: string): PaymentEnv {
  const host = (rawHost || "").trim().toLowerCase().replace(/\.$/, "");
  if (!host) return "live";

  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1") {
    return "sandbox";
  }
  if (host.endsWith(".localhost")) return "sandbox";
  if (host.includes("preview--")) return "sandbox";
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return "sandbox";
  if (host.endsWith(".sandbox.lovable.app")) return "sandbox";
  if (host.endsWith(".lovable.dev")) return "sandbox";
  if (host.endsWith(".gptengineer.app")) return "sandbox";

  return "live";
}

export function resolvePaymentEnv(req: Request): PaymentEnv {
  const raw = req.headers.get("origin") || req.headers.get("referer") || "";
  let host = "";
  try {
    host = new URL(raw).hostname;
  } catch {
    host = "";
  }
  return classifyHost(host);
}
