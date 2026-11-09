import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { consumeGuestQuota } from "./calculo-guard.ts";

const now = Date.parse("2026-11-09T14:07:00Z");
const day = 24 * 60 * 60 * 1000;
type Row = { ip_hash: string; action: string; created_at: string };

function fakeClient(rows: Row[]) {
  return {
    from() {
      const filters: Array<(row: Row) => boolean> = [];
      const q = {
        select: () => q,
        eq: (key: keyof Row, value: string) => { filters.push(row => row[key] === value); return q; },
        gte: (_key: string, value: string) => { filters.push(row => row.created_at >= value); return q; },
        insert: async (row: Omit<Row, "created_at">) => {
          rows.push({ ...row, created_at: new Date(now).toISOString() });
          return { error: null };
        },
        then: (resolve: (value: unknown) => void) => resolve({ count: rows.filter(row => filters.every(f => f(row))).length, error: null }),
      };
      return q;
    },
  } as unknown as Parameters<typeof consumeGuestQuota>[0];
}

const row = (action: string, age = 1000, ip = "visitor"): Row => ({
  ip_hash: ip, action, created_at: new Date(now - age).toISOString(),
});

Deno.test("busca e cálculo anteriores não consomem a única pergunta de chat em 24h", async () => {
  const rows = [row("search"), row("calculo")];
  const result = await consumeGuestQuota(fakeClient(rows), "visitor", "chat", {}, 1, day, now);
  assertEquals(result, { userId: null, guest: true });
  assertEquals(rows.filter(r => r.action === "chat").length, 1);
});

Deno.test("segunda pergunta de chat em 24h continua bloqueada", async () => {
  const rows = [row("chat")];
  const result = await consumeGuestQuota(fakeClient(rows), "visitor", "chat", {}, 1, day, now);
  assertEquals(result instanceof Response, true);
  if (!(result instanceof Response)) throw new Error("Esperado bloqueio");
  assertEquals(result.status, 429);
  assertEquals((await result.json()).guest_limit, true);
  assertEquals(rows.length, 1);
});

Deno.test("pergunta expirada e pergunta de outro IP não bloqueiam a demonstração", async () => {
  const result = await consumeGuestQuota(fakeClient([row("chat", day + 1), row("chat", 1000, "other")]), "visitor", "chat", {}, 1, day, now);
  assertEquals(result, { userId: null, guest: true });
});

Deno.test("rajada global de 30 chamadas por hora continua bloqueando o chat sem consumir sua cota", async () => {
  const rows = Array.from({ length: 30 }, (_, i) => row(i % 2 ? "search" : "calculo"));
  const result = await consumeGuestQuota(fakeClient(rows), "visitor", "chat", {}, 1, day, now);
  if (!(result instanceof Response)) throw new Error("Esperado bloqueio de rajada");
  assertEquals(result.status, 429);
  const body = await result.json();
  assertEquals(body.burst_limit, true);
  assertEquals(body.guest_limit, undefined);
  assertEquals(rows.length, 30);
});