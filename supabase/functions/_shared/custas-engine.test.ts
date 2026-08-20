import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  calcularCustas,
  CustasError,
  type RegraCustas,
  type UnidadeFiscal,
} from "./custas-engine.ts";

/**
 * Casos com resultado calculado à mão a partir da Lei Estadual 11.608/2003
 * (redação da Lei 17.785/2023). UFESP 2026 = R$ 38,42.
 * As fixtures espelham as linhas semeadas em `custas_regras` / `unidades_fiscais`.
 */

const UNIDADES: UnidadeFiscal[] = [
  { codigo: "UFESP", ano: 2023, valor: 34.26, fonte_normativa: "SEFAZ-SP", vigencia_inicio: "2023-01-01" },
  { codigo: "UFESP", ano: 2024, valor: 35.36, fonte_normativa: "SEFAZ-SP", vigencia_inicio: "2024-01-01" },
  { codigo: "UFESP", ano: 2025, valor: 37.02, fonte_normativa: "SEFAZ-SP", vigencia_inicio: "2025-01-01" },
  { codigo: "UFESP", ano: 2026, valor: 38.42, fonte_normativa: "SEFAZ-SP", vigencia_inicio: "2026-01-01" },
];

const base = {
  tribunal: "TJSP",
  uf: "SP",
  unidade_fiscal: "UFESP",
  tipo_guia: "DARE",
  codigo_receita: "230-6",
  url_emissao: "https://portaldecustas.tjsp.jus.br/portaltjsp",
  fonte_normativa: "Lei Estadual 11.608/2003",
  observacoes: null,
} as const;

const REGRAS: RegraCustas[] = [
  { ...base, tipo_ato: "distribuicao_acao", base_calculo: "valor_causa", aliquota: 1.0, valor_fixo_qtd: null, piso_qtd: 5, teto_qtd: 3000, vigencia_inicio: "2004-01-01", vigencia_fim: "2024-01-02" },
  { ...base, tipo_ato: "distribuicao_acao", base_calculo: "valor_causa", aliquota: 1.5, valor_fixo_qtd: null, piso_qtd: 5, teto_qtd: 3000, vigencia_inicio: "2024-01-03", vigencia_fim: null },
  { ...base, tipo_ato: "execucao_titulo_extrajudicial", base_calculo: "valor_causa", aliquota: 2.0, valor_fixo_qtd: null, piso_qtd: 5, teto_qtd: 3000, vigencia_inicio: "2024-01-03", vigencia_fim: null },
  { ...base, tipo_ato: "cumprimento_sentenca", base_calculo: "valor_credito", aliquota: 2.0, valor_fixo_qtd: null, piso_qtd: 5, teto_qtd: 3000, vigencia_inicio: "2024-01-03", vigencia_fim: null },
  { ...base, tipo_ato: "preparo_apelacao", base_calculo: "valor_condenacao", aliquota: 4.0, valor_fixo_qtd: null, piso_qtd: 5, teto_qtd: 3000, vigencia_inicio: "2024-01-03", vigencia_fim: null },
  { ...base, tipo_ato: "agravo_instrumento", base_calculo: "fixo", aliquota: null, valor_fixo_qtd: 10, piso_qtd: null, teto_qtd: null, vigencia_inicio: "2004-01-01", vigencia_fim: "2024-01-02" },
  { ...base, tipo_ato: "agravo_instrumento", base_calculo: "fixo", aliquota: null, valor_fixo_qtd: 15, piso_qtd: null, teto_qtd: null, vigencia_inicio: "2024-01-03", vigencia_fim: null },
];

const calc = (input: Parameters<typeof calcularCustas>[0]) => calcularCustas(input, REGRAS, UNIDADES);

Deno.test("1. distribuição de R$ 100.000 → R$ 1.500,00", () => {
  const r = calc({ tribunal: "TJSP", tipo_ato: "distribuicao_acao", valor_base: 100_000, data_ato: "2026-03-10" });
  assertEquals(r.valor_devido, 1500);
  assertEquals(r.piso_aplicado, false);
  assertEquals(r.teto_aplicado, false);
});

Deno.test("2. distribuição de R$ 5.000 → R$ 192,10 (piso)", () => {
  const r = calc({ tribunal: "TJSP", tipo_ato: "distribuicao_acao", valor_base: 5_000, data_ato: "2026-03-10" });
  assertEquals(r.valor_bruto, 75);
  assertEquals(r.valor_devido, 192.1);
  assertEquals(r.piso_aplicado, true);
});

Deno.test("3. distribuição de R$ 10.000.000 → R$ 115.260,00 (teto)", () => {
  const r = calc({ tribunal: "TJSP", tipo_ato: "distribuicao_acao", valor_base: 10_000_000, data_ato: "2026-03-10" });
  assertEquals(r.valor_devido, 115_260);
  assertEquals(r.teto_aplicado, true);
});

Deno.test("4. execução de título extrajudicial de R$ 50.000 → R$ 1.000,00", () => {
  const r = calc({ tribunal: "TJSP", tipo_ato: "execucao_titulo_extrajudicial", valor_base: 50_000, data_ato: "2026-03-10" });
  assertEquals(r.valor_devido, 1000);
});

Deno.test("5. cumprimento de sentença de R$ 80.000 → R$ 1.600,00", () => {
  const r = calc({ tribunal: "TJSP", tipo_ato: "cumprimento_sentenca", valor_base: 80_000, data_ato: "2026-03-10" });
  assertEquals(r.regra_aplicada.base_calculo, "valor_credito");
  assertEquals(r.valor_devido, 1600);
});

Deno.test("6. preparo de apelação de R$ 120.000 → R$ 4.800,00", () => {
  const r = calc({ tribunal: "TJSP", tipo_ato: "preparo_apelacao", valor_base: 120_000, data_ato: "2026-03-10" });
  assertEquals(r.valor_devido, 4800);
});

Deno.test("7. agravo de instrumento → R$ 576,30 (15 UFESPs)", () => {
  const r = calc({ tribunal: "TJSP", tipo_ato: "agravo_instrumento", valor_base: 0, data_ato: "2026-03-10" });
  assertEquals(r.valor_devido, 576.3);
});

Deno.test("8. ato anterior a 03/01/2024 aplica 1% e a UFESP da competência", () => {
  const r = calc({ tribunal: "TJSP", tipo_ato: "distribuicao_acao", valor_base: 100_000, data_ato: "2023-06-15" });
  assertEquals(r.regra_aplicada.aliquota, 1);
  assertEquals(r.valor_devido, 1000);
  assertEquals(r.unidade_fiscal.ano, 2023);
});

Deno.test("9. isenção zera o valor devido e preenche o motivo", () => {
  const r = calc({ tribunal: "TJSP", tipo_ato: "distribuicao_acao", valor_base: 100_000, data_ato: "2026-03-10", justica_gratuita: true });
  assertEquals(r.valor_devido, 0);
  assertEquals(r.isento, true);
  assertEquals(typeof r.motivo_isencao, "string");
});

Deno.test("10. litisconsórcio: 15 autores acrescem 10 UFESPs (R$ 384,20)", () => {
  // Leitura conservadora: o primeiro grupo de 10 já está coberto pela taxa.
  const r = calc({ tribunal: "TJSP", tipo_ato: "distribuicao_acao", valor_base: 100_000, data_ato: "2026-03-10", qtd_autores: 15 });
  assertEquals(r.acrescimo_litisconsorcio, 384.2);
  assertEquals(r.valor_devido, 1884.2);
});

Deno.test("11. sem UFESP cadastrada para a competência, o erro nomeia o exercício", () => {
  assertThrows(
    () => calc({ tribunal: "TJSP", tipo_ato: "distribuicao_acao", valor_base: 1000, data_ato: "2010-05-01" }),
    CustasError,
    "2010",
  );
});
