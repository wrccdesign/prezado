import { describe, it, expect } from "vitest";
import { parseValorBR } from "@/lib/currency";

describe("parseValorBR", () => {
  it("lê padrão brasileiro com milhar e vírgula decimal", () => {
    expect(parseValorBR("1.500,50")).toBe(1500.5);
  });

  it("lê ponto como decimal quando não há vírgula", () => {
    expect(parseValorBR("1500.50")).toBe(1500.5);
  });

  it("lê inteiro sem separadores", () => {
    expect(parseValorBR("10000")).toBe(10000);
  });

  it("lê vírgula decimal sem milhar", () => {
    expect(parseValorBR("99,90")).toBe(99.9);
  });

  it("lê ponto com 3 dígitos como milhar", () => {
    expect(parseValorBR("10.000")).toBe(10000);
    expect(parseValorBR("1.500")).toBe(1500);
  });

  it("lê vários pontos como milhares", () => {
    expect(parseValorBR("1.500.000")).toBe(1500000);
  });

  it("lê milhar brasileiro com centavos", () => {
    expect(parseValorBR("1.000.000,00")).toBe(1000000);
  });
});
