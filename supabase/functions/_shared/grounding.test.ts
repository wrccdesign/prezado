import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { classifyNatureza, collectUsable, isUsableSource, type GroundingDecision } from "./grounding.ts";

const EMENTA = "APELAÇÃO CÍVEL. TRANSPORTE AÉREO. Cancelamento de voo por manutenção não programada. Fortuito interno.";

Deno.test("decisão interlocutória nunca é apoio, mesmo com ementa", () => {
  assertEquals(classifyNatureza(EMENTA, "Procedente", "Decisão Interlocutória"), "relacionado");
  assertEquals(classifyNatureza(EMENTA, null, "Decisão Interlocutória de Mérito"), "relacionado");
});

Deno.test("homologação nunca é apoio", () => {
  assertEquals(classifyNatureza(EMENTA, "Homologado", "Homologação de Transação"), "relacionado");
});

Deno.test("acórdão com ementa é precedente", () => {
  assertEquals(classifyNatureza(EMENTA, "Provido", "Acórdão"), "precedente");
});

Deno.test("sentença sem ementa com resultado é só caso análogo", () => {
  assertEquals(classifyNatureza(null, "Procedente", "Sentença"), "julgado");
});

Deno.test("registro sem ementa que não é sentença fica fora", () => {
  assertEquals(classifyNatureza(null, "Procedente", "Acórdão"), "relacionado");
  assertEquals(classifyNatureza("", "Procedente", null), "relacionado");
  assertEquals(classifyNatureza(null, null, "Sentença"), "relacionado");
});

Deno.test("filtro mínimo descarta o que não pode ser citado", () => {
  assertEquals(isUsableSource({ natureza: "relacionado" }), false);
  assertEquals(isUsableSource({ natureza: "julgado" }), true);
  assertEquals(isUsableSource({ natureza: "precedente" }), true);
});

const row = (id: string, tipo: string | null, ementa: string | null, resultado: string | null) => ({
  id, tipo_decisao: tipo, ementa, resultado, tribunal: "TJPR",
});

Deno.test("nenhum relacionado sai da montagem, venha da busca vetorial ou do FTS", () => {
  const results: GroundingDecision[] = [];
  const seen = new Set<string>();
  // Vetorial: 3 inutilizáveis e 1 precedente
  collectUsable(results, seen, [
    row("v1", "Decisão Interlocutória", EMENTA, "Deferido"),
    row("v2", "Acórdão", null, "Provido"),
    row("v3", "Homologação de Transação", null, "Homologado"),
    row("v4", "Acórdão", EMENTA, "Provido"),
  ], 5);
  // Com menos de 3 utilizáveis, o fallback roda
  assertEquals(results.length < 3, true);
  collectUsable(results, seen, [
    row("v4", "Acórdão", EMENTA, "Provido"), // repetida
    row("f1", "Sentença", null, null),
    row("f2", "Sentença", null, "Procedente"),
    row("f3", "Acórdão", EMENTA, "Desprovido"),
  ], 5);
  assertEquals(results.map((r) => r.id), ["v4", "f2", "f3"]);
  assertEquals(results.some((r) => r.natureza === "relacionado"), false);
});

Deno.test("montagem respeita o limite", () => {
  const out = collectUsable([], new Set(), [1, 2, 3, 4].map((i) => row(`a${i}`, "Acórdão", EMENTA, "Provido")), 2);
  assertEquals(out.length, 2);
});
