import { describe, it, expect } from "vitest";
import { calcularRescisao } from "@/lib/rescisao";

const base = {
  remuneracao: 3000,
  admissao: new Date(2024, 7, 10),
  demissao: new Date(2026, 9, 1),
  tipo: "sem_justa_causa" as const,
  saldoFgts: null,
  periodosVencidosNaoGozados: 0,
};
const val = (r: ReturnType<typeof calcularRescisao>, l: string) => r.verbas.find((v) => v.label === l)?.valor;

describe("rescisão trabalhista", () => {
  it("projeta 36 dias de aviso e dá 10/12 de 13º", () => {
    const r = calcularRescisao(base);
    expect(r.diasAviso).toBe(36);
    expect(val(r, "13º salário proporcional")).toBe(2500);
  });
  it("férias proporcionais usam a projeção do aviso: 3/12", () => {
    const r = calcularRescisao(base);
    expect(val(r, "Férias proporcionais")).toBe(750);
    expect(val(r, "1/3 de férias proporcionais")).toBe(250);
  });
  it("FGTS fica fora do total bruto", () => {
    const r = calcularRescisao(base);
    const soma = r.verbas.reduce((a, b) => a + b.valor, 0);
    expect(r.totalBruto).toBeCloseTo(soma, 2);
    expect(r.verbas.some((v) => v.label.includes("FGTS"))).toBe(false);
  });
  it("sem saldo informado, estima o FGTS pelos meses trabalhados", () => {
    const r = calcularRescisao(base);
    expect(r.saldoFgtsEstimado).toBe(true);
    // saldo estimado 8% x 3000 x 26 meses = 6240; multa > R$ 96
    expect(r.fgts.find((f) => f.label.startsWith("Multa"))!.valor).toBeGreaterThan(2400);
  });
  it("férias vencidas seguem o número de períodos informado", () => {
    const r = calcularRescisao({ ...base, periodosVencidosNaoGozados: 2 });
    expect(val(r, "Férias vencidas")).toBe(6000);
    expect(calcularRescisao(base).verbas.some((v) => v.label === "Férias vencidas")).toBe(false);
  });
  it("demissão em 10/12 com aviso projetado para janeiro mantém 12/12 do ano", () => {
    const r = calcularRescisao({ ...base, admissao: new Date(2024, 11, 1), demissao: new Date(2025, 11, 10) });
    expect(r.dataProjetada.getFullYear()).toBe(2026);
    expect(val(r, "13º salário proporcional")).toBe(3000);
  });
});
