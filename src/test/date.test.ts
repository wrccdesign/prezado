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
