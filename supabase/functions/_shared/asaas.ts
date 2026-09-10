import { resolvePaymentEnv } from "./payment-env.ts";

export type AsaasEnv = "sandbox" | "live";

const ASAAS_BASE = {
  sandbox: "https://sandbox.asaas.com/api/v3",
  live: "https://api.asaas.com/api/v3",
} as const;

const getEnv = (key: string): string => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`${key} is not configured`);
  return value;
};

export function getApiKey(env: AsaasEnv): string {
  return env === "sandbox" ? getEnv("ASAAS_SANDBOX_API_KEY") : getEnv("ASAAS_LIVE_API_KEY");
}

export function getWebhookToken(): string {
  return getEnv("ASAAS_WEBHOOK_TOKEN");
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
  options: { email?: string; userId?: string; name?: string; cpfCnpj?: string },
): Promise<AsaasCustomer> {
  if (options.userId) {
    const existing = await asaasRequest<{ data: AsaasCustomer[] }>(
      env,
      `/customers?externalReference=${encodeURIComponent(options.userId)}&limit=1`,
    );
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.cpfCnpj && customer.cpfCnpj !== options.cpfCnpj) {
        await asaasRequest<AsaasCustomer>(env, `/customers/${customer.id}`, {
          method: "PUT",
          body: { cpfCnpj: options.cpfCnpj },
        });
        customer.cpfCnpj = options.cpfCnpj;
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
      externalReference: options.userId,
    },
  });
}

export async function createSubscription(
  env: AsaasEnv,
  customerId: string,
  priceId: PriceId,
): Promise<AsaasSubscription> {
  const config = PLAN_CONFIG[priceId];
  return asaasRequest<AsaasSubscription>(env, "/subscriptions", {
    method: "POST",
    body: {
      customer: customerId,
      billingType: "UNDEFINED",
      value: config.valueCents / 100,
      cycle: config.cycle,
      description: config.description,
      externalReference: priceId,
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
