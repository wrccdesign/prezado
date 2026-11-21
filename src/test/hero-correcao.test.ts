import { describe, expect, it } from "vitest";
import { EXEMPLO } from "@/components/landing/HeroMiniCorrecao";

describe("exemplo da Home conferido com a função publicada", () => {
  it("usa o saldo do período 01/01/2024 a 01/09/2024 com Tema 1.368", () => {
    expect(EXEMPLO.corrigido).toBe(10705.59);
  });

  it("inclui os juros separados no total do exemplo", () => {
    expect(EXEMPLO.juros).toBe(6.59);
    expect(EXEMPLO.total).toBe(10712.18);
    expect(Math.round((EXEMPLO.corrigido + EXEMPLO.juros) * 100) / 100).toBe(EXEMPLO.total);
  });
});