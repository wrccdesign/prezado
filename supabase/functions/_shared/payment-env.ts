export type PaymentEnv = "sandbox" | "live";

/**
 * Resolve the payment environment SERVER-SIDE.
 *
 * The client used to send `x-payment-env`, which meant a production user could
 * claim `sandbox` and inherit a subscription paid with a test card. We now
 * derive the environment from the request Origin/Referer instead: only the
 * Lovable preview and local dev map to sandbox, everything else is live.
 */
export function resolvePaymentEnv(req: Request): PaymentEnv {
  const raw = req.headers.get("origin") || req.headers.get("referer") || "";
  let host = "";
  try {
    host = new URL(raw).hostname.toLowerCase();
  } catch {
    host = "";
  }

  if (!host) return "live";
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")) return "sandbox";
  if (host.startsWith("id-preview--")) return "sandbox";
  if (host.endsWith(".lovableproject.com")) return "sandbox";
  if (host.endsWith(".sandbox.lovable.app")) return "sandbox";
  return "live";
}
