import { describe, it, expect } from "vitest";
import { formatDateBR } from "@/lib/date";

describe("formatDateBR", () => {
  it("não volta um dia para data pura (TJRS 50043316220248210090)", () => {
    expect(formatDateBR("2024-11-29")).toBe("29/11/2024");
  });

  it("TJAL 07059428720258020058", () => {
    expect(formatDateBR("2025-04-11")).toBe("11/04/2025");
  });

  it("tolera timestamp junto", () => {
    expect(formatDateBR("2024-11-29T00:00:00Z")).toBe("29/11/2024");
  });

  it("tolera null e vazio", () => {
    expect(formatDateBR(null)).toBe("");
    expect(formatDateBR("")).toBe("");
    expect(formatDateBR(undefined)).toBe("");
  });

  it("devolve o valor original se o formato for inesperado", () => {
    expect(formatDateBR("29/11/2024")).toBe("29/11/2024");
  });
});

import { somarDiasUteis, diferencaDatas, feriadosNacionais } from "@/lib/date";

describe("dias úteis com feriados nacionais", () => {
  it("22/10/2026 + 15 dias úteis pula Finados e 15/11 e 20/11", () => {
    const { final, descartados } = somarDiasUteis(new Date(2026, 9, 22), 15);
    expect(final.getDate()).toBe(13);
    expect(final.getMonth()).toBe(10);
    expect(descartados.some(d => d.data === "02/11/2026" && d.motivo === "Finados")).toBe(true);
  });
  it("Sexta-feira da Paixão de 2026 é 03/04", () => {
    expect(feriadosNacionais(2026).get("2026-04-03")).toBe("Sexta-feira da Paixão");
  });
  it("datas invertidas devolvem sinal negativo", () => {
    const r = diferencaDatas(new Date(2026, 11, 31), new Date(2026, 0, 1));
    expect(r.invertido).toBe(true);
    expect(r.corridos).toBe(-364);
    expect(r.uteis).toBeLessThan(0);
  });
});
