import { assert, assertAlmostEquals, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { calcular, type Parametros, parseISO } from "./calculo.ts";

// Índices fictícios e explícitos (não vêm do Banco Central).
const SELIC = 0.9;   // % a.m., selic_mensal (SGS 4390)
const IPCA = 0.4;    // % a.m.
const TAXA_LEGAL = 0.5; // % a.m., taxa_legal (SGS 29543)
const INPC = 0.3;

function mapa(ini: string, fim: string): Map<string, number> {
  const m = new Map<string, number>();
  const cur = parseISO(ini)!; const last = parseISO(fim)!;
  cur.setUTCDate(1);
  while (cur <= last) {
    const k = cur.toISOString().slice(0, 10);
    m.set(`selic_mensal|${k}`, SELIC);
    m.set(`ipca|${k}`, IPCA);
    m.set(`taxa_legal|${k}`, TAXA_LEGAL);
    m.set(`inpc|${k}`, INPC);
    cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  return m;
}

function params(o: Partial<Parametros> & { ini: string; fim: string; jIni?: string }): Parametros {
  return {
    valor: 10000, dIni: parseISO(o.ini)!, dFim: parseISO(o.fim)!, indice: o.indice ?? "ipca",
    proRata: o.proRata ?? true, manterIndiceContratual: false,
    regimeJuros: o.regimeJuros ?? "legal_14905", tipoJuros: "simples", taxaFixa: o.taxaFixa ?? 0,
    jurosIni: parseISO(o.jIni ?? o.ini)!, jurosFim: parseISO(o.fim)!,
  };
}

Deno.test("A: só depois da lei, IPCA + Taxa Legal, sem Selic nem 1%", () => {
  const r = calcular(params({ ini: "2024-08-30", fim: "2025-09-30" }), mapa("2024-08-01", "2025-09-30"));
  assertEquals(r.memoria[0].indice_utilizado, "ipca (30 e 31/08)");
  // agosto: só dias 30 e 31 -> 2/31 de IPCA
  assertAlmostEquals(r.memoria[0].fator_do_mes, 1 + 0.004 * 2 / 31, 1e-9);
  for (const l of r.memoria) assert(!l.indice_utilizado.includes("selic"), l.mes_ref);
  // fator = (1+0,004*2/31) * 1,004^13
  const fator = (1 + 0.004 * 2 / 31) * Math.pow(1.004, 13);
  assertAlmostEquals(r.fatorAcumulado, fator, 1e-9);
  // juros simples: 0,5% * saldo corrigido do mês (ago: 2/31)
  assert(r.juros > 0);
  assert(r.criterios.some((c) => c.startsWith("A partir de 30/08/2024")));
  assert(!r.criterios.some((c) => c.includes("Tema 1.368")));
  console.log("A", r.valorCorrigido, r.juros, (r.valorCorrigido + r.juros).toFixed(2));
});

Deno.test("B: só no Tema 1.368, só Selic, sem IPCA nem juros separados", () => {
  const r = calcular(params({ ini: "2024-01-15", fim: "2024-08-29" }), mapa("2024-01-01", "2024-08-29"));
  for (const l of r.memoria) {
    assert(l.indice_utilizado.startsWith("selic (Tema 1.368"), l.indice_utilizado);
    assertEquals(l.juros_do_mes, 0);
  }
  assertEquals(r.juros, 0);
  // jan: 17/31; fev-jul: cheios; ago: 29/31
  const fator = (1 + 0.009 * 17 / 31) * Math.pow(1.009, 6) * (1 + 0.009 * 29 / 31);
  assertAlmostEquals(r.fatorAcumulado, fator, 1e-9);
  assertAlmostEquals(r.memoria.at(-1)!.fator_do_mes, 1 + 0.009 * 29 / 31, 1e-9);
  assert(r.criterios.some((c) => c.startsWith("De 15/01/2024 a 29/08/2024: Selic")));
  console.log("B", r.valorCorrigido, r.juros);
});

Deno.test("C: cruza 30/08/2024, agosto rateado Selic 1-29 e IPCA 30-31", () => {
  const r = calcular(params({ ini: "2024-01-15", fim: "2025-09-30" }), mapa("2024-01-01", "2025-09-30"));
  const ago = r.memoria.find((l) => l.mes_ref === "2024-08-01")!;
  assertEquals(ago.regime, "transicao_14905");
  assertEquals(ago.indice_utilizado, "selic (Tema 1.368, juros e correção) (1 a 29/08) + ipca (30 e 31/08)");
  assertAlmostEquals(ago.fator_do_mes, 1 + 0.009 * 29 / 31 + 0.004 * 2 / 31, 1e-9);
  const set = r.memoria.find((l) => l.mes_ref === "2024-09-01")!;
  assertEquals(set.indice_utilizado, "ipca");
  const fator = (1 + 0.009 * 17 / 31) * Math.pow(1.009, 6) * (1 + 0.009 * 29 / 31 + 0.004 * 2 / 31) *
    Math.pow(1.004, 13);
  assertAlmostEquals(r.fatorAcumulado, fator, 1e-9);
  assertEquals(r.memoria.filter((l) => l.mes_ref < "2024-08-01").every((l) => l.juros_do_mes === 0), true);
  console.log("C", r.valorCorrigido, r.juros, (r.valorCorrigido + r.juros).toFixed(2));
});

Deno.test("regressão: correção antes dos juros usa só o índice até o termo inicial", () => {
  const r = calcular(params({ ini: "2022-01-15", fim: "2024-08-29", jIni: "2023-01-15" }),
    mapa("2022-01-01", "2024-08-29"));
  const dez22 = r.memoria.find((l) => l.mes_ref === "2022-12-01")!;
  assertEquals(dez22.indice_utilizado, "ipca");
  const jan23 = r.memoria.find((l) => l.mes_ref === "2023-01-01")!;
  assertAlmostEquals(jan23.fator_do_mes, 1 + 0.004 * 14 / 31 + 0.009 * 17 / 31, 1e-9);
  const fev23 = r.memoria.find((l) => l.mes_ref === "2023-02-01")!;
  assertEquals(fev23.indice_utilizado, "selic (Tema 1.368, juros e correção)");
});

Deno.test("regressão: antes de 11/01/2003, 0,5% a.m. + índice, sem Selic", () => {
  const r = calcular(params({ ini: "2002-06-01", fim: "2002-12-31", indice: "inpc" }),
    mapa("2002-06-01", "2002-12-31"));
  for (const l of r.memoria) assertEquals(l.indice_utilizado, "inpc");
  assertAlmostEquals(r.fatorAcumulado, Math.pow(1.003, 7), 1e-9);
  assert(r.juros > 0);
  assert(r.criterios[0].startsWith("Até 10/01/2003"));
  // janeiro/2003: dias 1-10 inpc + 0,5%; 11-31 Selic
  const j = calcular(params({ ini: "2003-01-01", fim: "2003-01-31", indice: "inpc" }), mapa("2003-01-01", "2003-01-31"));
  assertAlmostEquals(j.memoria[0].fator_do_mes, 1 + 0.003 * 10 / 31 + 0.009 * 21 / 31, 1e-9);
});

Deno.test("regressão: taxa_fixa 1% + IPCA continua cumulando", () => {
  const r = calcular(params({ ini: "2024-01-01", fim: "2024-06-30", regimeJuros: "taxa_fixa", taxaFixa: 1 }),
    mapa("2024-01-01", "2024-06-30"));
  for (const l of r.memoria) assertEquals(l.indice_utilizado, "ipca");
  assertAlmostEquals(r.fatorAcumulado, Math.pow(1.004, 6), 1e-9);
  assert(r.memoria.every((l) => l.juros_do_mes > 0));
});
