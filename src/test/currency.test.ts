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
});
