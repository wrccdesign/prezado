import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  ADMIN_PLAN, BURST_LIMIT_PER_HOUR, UNLIMITED, burstLimitMessage, checkRateLimit, countNoun, monthlyLimitMessage,
} from "./rate-limit.ts";

/** Cliente falso: só o suficiente para checkRateLimit. */
function fakeClient(opts: { admin: boolean; plan: string; usedMonth: number; usedHour: number }) {
  const inserts: Array<Record<string, unknown>> = [];
  const client = {
    inserts,
    rpc: async () => ({ data: opts.plan, error: null }),
    from(table: string) {
      if (table === "user_roles") {
        const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: opts.admin ? { role: "admin" } : null, error: null }) };
        return q;
      }
      // usage_tracking
      let byAction = false;
      const q: any = {
        insert: async (row: Record<string, unknown>) => { inserts.push(row); return { error: null }; },
        select: () => q,
        eq: (col: string) => { if (col === "action") byAction = true; return q; },
        lt: () => q,
        gte: () => q,
        then: (res: (v: unknown) => void) => res({ count: byAction ? opts.usedMonth : opts.usedHour, error: null }),
      };
      return q;
    },
  };
  return client;
}

Deno.test("admin passa sem cota e sem trava de rajada, e o uso é registrado com a mesma action", async () => {
  const c = fakeClient({ admin: true, plan: "free", usedMonth: 999, usedHour: BURST_LIMIT_PER_HOUR + 10 });
  const r = await checkRateLimit("u1", "peticao", "", "", "live", { client: c });
  assertEquals(r.allowed, true);
  assertEquals(r.plan, ADMIN_PLAN);
  assertEquals(r.limit, UNLIMITED);
  assertEquals(c.inserts, [{ user_id: "u1", action: "peticao" }]);
});

Deno.test("não-admin no free continua barrado em petição (limite 0)", async () => {
  const c = fakeClient({ admin: false, plan: "free", usedMonth: 0, usedHour: 0 });
  const r = await checkRateLimit("u2", "peticao", "", "", "live", { client: c });
  assertEquals(r.allowed, false);
  assertEquals(r.limit, 0);
  assertEquals(c.inserts.length, 0);
});

Deno.test("não-admin no free com 1 diagnóstico usado é barrado", async () => {
  const c = fakeClient({ admin: false, plan: "free", usedMonth: 1, usedHour: 1 });
  const r = await checkRateLimit("u3", "diagnostico", "", "", "live", { client: c });
  assertEquals(r.allowed, false);
  assertEquals(r.limit, 1);
});

Deno.test("não-admin continua sujeito à trava de rajada", async () => {
  const c = fakeClient({ admin: false, plan: "escritorio", usedMonth: 0, usedHour: BURST_LIMIT_PER_HOUR });
  const r = await checkRateLimit("u4", "chat", "", "", "live", { client: c });
  assertEquals(r.burstLimited, true);
});

Deno.test("singular e plural", () => {
  assertEquals(countNoun("diagnostico", 1), "1 diagnóstico");
  assertEquals(countNoun("diagnostico", 2), "2 diagnósticos");
  assertEquals(countNoun("analise", 1), "1 análise");
  assertEquals(countNoun("search", 20), "20 buscas");
  assertEquals(countNoun("documento", 1), "1 leitura de documento");
});

Deno.test("mensagem mensal: concordância, sem travessão e sem /planos", () => {
  const m = monthlyLimitMessage("diagnostico", 1, "free");
  assertStringIncludes(m, "Você usou seu 1 diagnóstico deste mês");
  assertStringIncludes(m, "O plano Profissional libera 60 diagnósticos por mês.");
  assertEquals(m.includes("—"), false);
  assertEquals(m.includes("/planos"), false);
  assertStringIncludes(monthlyLimitMessage("analise", 3, "free"), "Você usou suas 3 análises");
  assertEquals(monthlyLimitMessage("peticao", 0, "free").includes("/planos"), false);
});

Deno.test("mensagem de rajada sem travessão", () => {
  assertEquals(burstLimitMessage().includes("—"), false);
});
