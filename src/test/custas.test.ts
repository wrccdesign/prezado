import { describe, expect, it } from "vitest";
import {
  calcularCustas,
  CustasError,
  type RegraCustas,
  type UnidadeFiscal,
} from "../../supabase/functions/_shared/custas-engine";

/**
 * Fixtures espelhando exatamente as linhas semeadas em `custas_regras` e
 * `unidades_fiscais` para o TJSP. Resultados esperados calculados à mão a
 * partir da Lei Estadual 11.608/2003 (redação da Lei 17.785/2023).
 */

const UNIDADES: UnidadeFiscal[] = [
  { codigo: "UFESP", ano: 2024, valor: 35.36, fonte_normativa: "Decreto SP", vigencia_inicio: "2024-01-01" },
  { codigo: "UFESP", ano: 2025, valor: 37.02, fonte_normativa: "Decreto SP", vigencia_inicio: "2025-01-01" },
  { codigo: "UFESP", ano: 2026, valor: 38.42, fonte_normativa: "Decreto SP", vigencia_inicio: "2026-01-01" },
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

describe("custas TJSP", () => {
  it("1. aplica o piso de 5 UFESPs quando o percentual fica abaixo", () => {
    const r = calc({ tribunal: "TJSP", tipo_ato: "distribuicao_acao", valor_base: 5000, data_ato: "2026-08-20" });
    // 1,5% de 5.000 = 75,00 → piso 5 × 38,42 = 192,10
    expect(r.valor_bruto).toBe(75);
    expect(r.valor_devido).toBe(192.1);
    expect(r.piso_aplicado).toBe(true);
  });

  it("2. aplica o teto de 3.000 UFESPs quando o percentual excede", () => {
    const r = calc({ tribunal: "TJSP", tipo_ato: "distribuicao_acao", valor_base: 100_000_000, data_ato: "2026-08-20" });
    // 1,5% = 1.500.000 → teto 3.000 × 38,42 = 115.260,00
    expect(r.valor_devido).toBe(115_260);
    expect(r.teto_aplicado).toBe(true);
  });

  it("3. calcula normalmente no meio da faixa", () => {
    const r = calc({ tribunal: "TJSP", tipo_ato: "distribuicao_acao", valor_base: 100_000, data_ato: "2026-08-20" });
    expect(r.valor_devido).toBe(1500);
    expect(r.piso_aplicado).toBe(false);
    expect(r.teto_aplicado).toBe(false);
  });

  it("4. ato anterior a 03/01/2024 usa a alíquota de 1%", () => {
    const r = calc({ tribunal: "TJSP", tipo_ato: "distribuicao_acao", valor_base: 100_000, data_ato: "2024-01-02" });
    expect(r.regra_aplicada.aliquota).toBe(1);
    expect(r.valor_devido).toBe(1000);
    expect(r.unidade_fiscal.ano).toBe(2024);
  });

  it("5. ato a partir de 03/01/2024 usa a alíquota de 1,5%", () => {
    const r = calc({ tribunal: "TJSP", tipo_ato: "distribuicao_acao", valor_base: 100_000, data_ato: "2024-01-03" });
    expect(r.regra_aplicada.aliquota).toBe(1.5);
    expect(r.valor_devido).toBe(1500);
  });

  it("6. execução de título extrajudicial: 2% do valor da causa", () => {
    const r = calc({ tribunal: "TJSP", tipo_ato: "execucao_titulo_extrajudicial", valor_base: 50_000, data_ato: "2026-03-10" });
    expect(r.valor_devido).toBe(1000);
  });

  it("7. cumprimento de sentença: 2% do crédito a satisfazer", () => {
    const r = calc({ tribunal: "TJSP", tipo_ato: "cumprimento_sentenca", valor_base: 20_000, data_ato: "2026-03-10" });
    expect(r.regra_aplicada.base_calculo).toBe("valor_credito");
    expect(r.valor_devido).toBe(400);
  });

  it("8. preparo de apelação: 4% sobre a condenação", () => {
    const r = calc({ tribunal: "TJSP", tipo_ato: "preparo_apelacao", valor_base: 250_000, data_ato: "2026-03-10" });
    expect(r.valor_devido).toBe(10_000);
  });

  it("9. agravo de instrumento: 15 UFESPs (e 10 no regime anterior)", () => {
    const novo = calc({ tribunal: "TJSP", tipo_ato: "agravo_instrumento", valor_base: 0, data_ato: "2026-01-10" });
    expect(novo.valor_devido).toBe(576.3); // 15 × 38,42
    const antigo = calc({ tribunal: "TJSP", tipo_ato: "agravo_instrumento", valor_base: 0, data_ato: "2024-01-02" });
    expect(antigo.valor_devido).toBe(353.6); // 10 × 35,36
  });

  it("10. litisconsórcio ativo voluntário acrescenta 10 UFESPs por grupo excedente", () => {
    const onze = calc({ tribunal: "TJSP", tipo_ato: "distribuicao_acao", valor_base: 100_000, data_ato: "2026-08-20", qtd_autores: 11 });
    expect(onze.acrescimo_litisconsorcio).toBe(384.2); // 10 × 38,42
    expect(onze.valor_devido).toBe(1884.2);

    const dez = calc({ tribunal: "TJSP", tipo_ato: "distribuicao_acao", valor_base: 100_000, data_ato: "2026-08-20", qtd_autores: 10 });
    expect(dez.acrescimo_litisconsorcio).toBe(0);

    const vinteEUm = calc({ tribunal: "TJSP", tipo_ato: "distribuicao_acao", valor_base: 100_000, data_ato: "2026-08-20", qtd_autores: 21 });
    expect(vinteEUm.acrescimo_litisconsorcio).toBe(768.4); // 2 grupos × 10 × 38,42
  });

  it("11. isenção zera o valor devido e registra a fundamentação", () => {
    const r = calc({ tribunal: "TJSP", tipo_ato: "distribuicao_acao", valor_base: 100_000, data_ato: "2026-08-20", justica_gratuita: true });
    expect(r.valor_devido).toBe(0);
    expect(r.isento).toBe(true);
    expect(r.motivo_isencao).toMatch(/justiça gratuita/i);
  });

  it("12. usa a UFESP vigente no primeiro dia do mês do recolhimento", () => {
    const r = calc({
      tribunal: "TJSP",
      tipo_ato: "distribuicao_acao",
      valor_base: 1000,
      data_ato: "2025-12-20",
      data_recolhimento: "2026-01-05",
    });
    expect(r.unidade_fiscal.ano).toBe(2026);
    expect(r.unidade_fiscal.referencia).toBe("2026-01-01");
    expect(r.valor_devido).toBe(192.1); // piso com a UFESP de 2026
  });

  it("13. rejeita ato sem regra cadastrada na data", () => {
    expect(() =>
      calc({ tribunal: "TJSP", tipo_ato: "execucao_titulo_extrajudicial", valor_base: 1000, data_ato: "2020-05-01" }),
    ).toThrow(CustasError);
  });
});
