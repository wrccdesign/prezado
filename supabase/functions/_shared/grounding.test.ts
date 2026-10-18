import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { classifyNatureza, isUsableSource } from "./grounding.ts";

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
