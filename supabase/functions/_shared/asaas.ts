import { resolvePaymentEnv } from "./payment-env.ts";

export type AsaasEnv = "sandbox" | "live";

const ASAAS_BASE = {
  sandbox: "https://sandbox.asaas.com/api/v3",
  live: "https://api.asaas.com/v3",
} as const;

const getEnv = (key: string): string => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`${key} is not configured`);
  return value;
};

export function getApiKey(env: AsaasEnv): string {
  return env === "sandbox" ? getEnv("ASAAS_SANDBOX_API_KEY") : getEnv("ASAAS_LIVE_API_KEY");
}

const CHECKOUT_HOST = {
  sandbox: "https://sandbox.asaas.com",
  live: "https://asaas.com",
} as const;

async function sha256(value: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return new Uint8Array(digest);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/**
 * Descobre o ambiente a partir do token recebido no webhook.
 * Nunca confia em parâmetro de URL. Comparação de tempo constante.
 */
export async function matchWebhookEnv(received: string): Promise<AsaasEnv | null> {
  if (!received) return null;
  const receivedHash = await sha256(received);
  let matched: AsaasEnv | null = null;

  for (const env of ["sandbox", "live"] as const) {
    const expected = Deno.env.get(
      env === "sandbox" ? "ASAAS_WEBHOOK_TOKEN_SANDBOX" : "ASAAS_WEBHOOK_TOKEN_LIVE",
    );
    if (!expected) continue;
    const ok = constantTimeEqual(receivedHash, await sha256(expected));
    if (ok && matched === null) matched = env;
  }

  return matched;
}

export function asaasBaseUrl(env: AsaasEnv): string {
  return ASAAS_BASE[env];
}

export function resolveAsaasEnv(req: Request): AsaasEnv {
  return resolvePaymentEnv(req);
}

export interface AsaasCustomer {
  id: string;
  name?: string;
  email?: string;
  cpfCnpj?: string;
  mobilePhone?: string;
  externalReference?: string;
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  value: number;
  cycle?: string;
  status: string;
  externalReference?: string;
  nextDueDate?: string;
  endDate?: string | null;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  value: number;
  status: string;
  billingType?: string;
  invoiceUrl?: string;
  externalReference?: string;
  dueDate?: string;
  subscription?: string | null;
}

export type PriceId =
  | "profissional_mensal"
  | "escritorio_mensal"
  | "profissional_anual"
  | "escritorio_anual";

export interface PlanConfig {
  planId: "profissional" | "escritorio";
  cycle: "MONTHLY" | "YEARLY";
  valueCents: number;
  description: string;
}

export const PLAN_CONFIG: Record<PriceId, PlanConfig> = {
  profissional_mensal: {
    planId: "profissional",
    cycle: "MONTHLY",
    valueCents: 4900,
    description: "Honorífico - Plano Profissional (mensal)",
  },
  escritorio_mensal: {
    planId: "escritorio",
    cycle: "MONTHLY",
    valueCents: 14900,
    description: "Honorífico - Plano Escritório (mensal)",
  },
  profissional_anual: {
    planId: "profissional",
    cycle: "YEARLY",
    valueCents: 40900,
    description: "Honorífico - Plano Profissional (anual)",
  },
  escritorio_anual: {
    planId: "escritorio",
    cycle: "YEARLY",
    valueCents: 124900,
    description: "Honorífico - Plano Escritório (anual)",
  },
};

export function planFromPriceId(priceId?: string | null): "free" | "profissional" | "escritorio" {
  if (!priceId) return "free";
  return PLAN_CONFIG[priceId as PriceId]?.planId ?? "free";
}

export function isRecurringPrice(priceId?: string | null): boolean {
  if (!priceId) return false;
  return PLAN_CONFIG[priceId as PriceId]?.cycle === "MONTHLY";
}

export async function asaasRequest<T>(
  env: AsaasEnv,
  path: string,
  options: { method?: "GET" | "POST" | "PUT" | "DELETE"; body?: Record<string, unknown> } = {},
): Promise<T> {
  const url = `${asaasBaseUrl(env)}${path}`;
  const init: RequestInit = {
    method: options.method ?? "GET",
    headers: {
      access_token: getApiKey(env),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };
  if (options.body) {
    init.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, init);
  const text = await res.text().catch(() => "{}");
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    json = {};
  }

  if (!res.ok) {
    console.error("Asaas request failed:", url, res.status, text.slice(0, 500));
    const message = json.errors?.[0]?.description || json.message || `Asaas ${res.status}`;
    throw new Error(message);
  }

  return json as T;
}

export async function findOrCreateCustomer(
  env: AsaasEnv,
  options: { email?: string; userId?: string; name?: string; cpfCnpj?: string; phone?: string },
): Promise<AsaasCustomer> {
  if (options.userId) {
    const existing = await asaasRequest<{ data: AsaasCustomer[] }>(
      env,
      `/customers?externalReference=${encodeURIComponent(options.userId)}&limit=1`,
    );
    if (existing.data.length) {
      const customer = existing.data[0];
      const updates: Record<string, string> = {};
      if (options.cpfCnpj && customer.cpfCnpj !== options.cpfCnpj) updates.cpfCnpj = options.cpfCnpj;
      if (options.phone && customer.mobilePhone !== options.phone) updates.mobilePhone = options.phone;
      if (Object.keys(updates).length) {
        await asaasRequest<AsaasCustomer>(env, `/customers/${customer.id}`, {
          method: "PUT",
          body: updates,
        });
        Object.assign(customer, updates);
      }
      return customer;
    }
  }

  if (options.email) {
    const byEmail = await asaasRequest<{ data: AsaasCustomer[] }>(
      env,
      `/customers?email=${encodeURIComponent(options.email)}&limit=1`,
    );
    if (byEmail.data.length) {
      const customer = byEmail.data[0];
      const updates: Record<string, string> = {};
      if (options.userId && customer.externalReference !== options.userId) updates.externalReference = options.userId;
      if (options.cpfCnpj && customer.cpfCnpj !== options.cpfCnpj) updates.cpfCnpj = options.cpfCnpj;
      if (options.phone && customer.mobilePhone !== options.phone) updates.mobilePhone = options.phone;
      if (Object.keys(updates).length) {
        await asaasRequest<AsaasCustomer>(env, `/customers/${customer.id}`, {
          method: "PUT",
          body: updates,
        });
        Object.assign(customer, updates);
      }
      return customer;
    }
  }

  return asaasRequest<AsaasCustomer>(env, "/customers", {
    method: "POST",
    body: {
      name: options.name || options.email || "Honorífico",
      email: options.email,
      cpfCnpj: options.cpfCnpj,
      mobilePhone: options.phone,
      externalReference: options.userId,
    },
  });
}

export async function createSubscription(
  env: AsaasEnv,
  customerId: string,
  priceId: PriceId,
  userId: string,
  billingType: "PIX" | "CREDIT_CARD" = "PIX",
): Promise<AsaasSubscription> {
  const config = PLAN_CONFIG[priceId];
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + 1);
  return asaasRequest<AsaasSubscription>(env, "/subscriptions", {
    method: "POST",
    body: {
      customer: customerId,
      billingType,
      value: config.valueCents / 100,
      cycle: config.cycle,
      nextDueDate: nextDueDate.toISOString().split("T")[0],
      description: config.description,
      externalReference: `${userId}:${priceId}`,
    },
  });
}

export async function createAnnualCharge(
  env: AsaasEnv,
  customerId: string,
  priceId: PriceId,
): Promise<AsaasPayment> {
  const config = PLAN_CONFIG[priceId];
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 3);
  return asaasRequest<AsaasPayment>(env, "/payments", {
    method: "POST",
    body: {
      customer: customerId,
      billingType: "UNDEFINED",
      value: config.valueCents / 100,
      dueDate: dueDate.toISOString().split("T")[0],
      description: config.description,
      externalReference: priceId,
    },
  });
}

export async function getSubscription(env: AsaasEnv, subscriptionId: string): Promise<AsaasSubscription> {
  return asaasRequest<AsaasSubscription>(env, `/subscriptions/${subscriptionId}`);
}

export async function getPayment(env: AsaasEnv, paymentId: string): Promise<AsaasPayment> {
  return asaasRequest<AsaasPayment>(env, `/payments/${paymentId}`);
}

export async function listCustomerPayments(
  env: AsaasEnv,
  customerId: string,
): Promise<AsaasPayment[]> {
  const res = await asaasRequest<{ data: AsaasPayment[] }>(
    env,
    `/payments?customer=${encodeURIComponent(customerId)}&limit=100&order=desc`,
  );
  return res.data;
}

export async function listSubscriptionPayments(
  env: AsaasEnv,
  subscriptionId: string,
): Promise<AsaasPayment[]> {
  const res = await asaasRequest<{ data: AsaasPayment[] }>(
    env,
    `/subscriptions/${encodeURIComponent(subscriptionId)}/payments?limit=100`,
  );
  return res.data ?? [];
}

export async function listCustomerSubscriptions(
  env: AsaasEnv,
  customerId: string,
): Promise<AsaasSubscription[]> {
  const res = await asaasRequest<{ data: AsaasSubscription[] }>(
    env,
    `/subscriptions?customer=${encodeURIComponent(customerId)}&limit=100`,
  );
  return res.data;
}

export async function cancelSubscription(
  env: AsaasEnv,
  subscriptionId: string,
): Promise<void> {
  await asaasRequest(env, `/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
  });
}

export async function updateSubscriptionValue(
  env: AsaasEnv,
  subscriptionId: string,
  valueCents: number,
): Promise<AsaasSubscription> {
  return asaasRequest<AsaasSubscription>(env, `/subscriptions/${subscriptionId}`, {
    method: "POST",
    body: { value: valueCents / 100 },
  });
}

export interface AsaasCheckoutSession {
  id: string;
  link?: string;
  status?: string;
}

export function checkoutSessionUrl(env: AsaasEnv, sessionId: string): string {
  return `${CHECKOUT_HOST[env]}/checkoutSession/show?id=${encodeURIComponent(sessionId)}`;
}

/**
 * Cria uma sessão de checkout hospedada do Asaas.
 * Mensal: cobrança recorrente. Anual: cobrança avulsa.
 */
export async function createCheckoutSession(
  env: AsaasEnv,
  options: {
    customerId?: string;
    priceId: PriceId;
    userId: string;
    successUrl: string;
    cancelUrl: string;
    expiredUrl: string;
    billingTypes?: string[];
  },
): Promise<AsaasCheckoutSession> {
  const config = PLAN_CONFIG[options.priceId];
  const recurring = config.cycle === "MONTHLY";
  const value = config.valueCents / 100;

  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + 1);
  const nextDueDateStr = nextDueDate.toISOString().split("T")[0];

  const body: Record<string, unknown> = {
    billingTypes: options.billingTypes ?? (recurring ? ["CREDIT_CARD"] : ["PIX", "CREDIT_CARD"]),
    chargeTypes: [recurring ? "RECURRENT" : "DETACHED"],
    minutesToExpire: 60,
    externalReference: `${options.userId}:${options.priceId}`,
    callback: {
      successUrl: options.successUrl,
      cancelUrl: options.cancelUrl,
      expiredUrl: options.expiredUrl,
    },
    items: [
      {
        name: config.description.replace("Honorífico - Plano ", "").slice(0, 30),
        description: config.description,
        quantity: 1,
        value,
      },
    ],
  };

  if (options.customerId) body.customer = options.customerId;

  if (recurring) {
    body.subscription = {
      cycle: "MONTHLY",
      nextDueDate: nextDueDateStr,
    };
  }

  return asaasRequest<AsaasCheckoutSession>(env, "/checkouts", {
    method: "POST",
    body,
  });
}
