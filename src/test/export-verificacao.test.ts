import { describe, it, expect } from "vitest";
import { urlConferencia, linhasRodapeVerificacao } from "@/lib/exportDocument";

describe("verificação da memória de cálculo", () => {
  it("o link de conferência mantém o pro rata ligado", () => {
    const u = new URL(urlConferencia("/calculadoras/correcao-monetaria-juros-lei-14905", { valor: "10000", pro_rata: "1" }));
    expect(u.searchParams.get("pro_rata")).toBe("1");
  });
  it("data do rodapé usa o fuso de São Paulo", () => {
    const [l] = linhasRodapeVerificacao({ url: "x", geradoEm: "2026-11-22T01:00:00Z" });
    expect(l).toContain("21/11/2026");
  });
});
