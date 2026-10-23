import { describe, it, expect } from "vitest";
import { buscarDecisoesCuradas, formatCnj, instanciaLabel, linkFonteConfiavel, relatorExibivel, sumulaRelevante } from "@/lib/jurisprudencia";

describe("jurisprudência", () => {
  it("dano moral atraso de voo encontra decisões curadas", () => {
    expect(buscarDecisoesCuradas("dano moral atraso de voo").length).toBeGreaterThan(0);
  });
  it("termo inexistente não traz nada", () => {
    expect(buscarDecisoesCuradas("xyzabc inexistente")).toEqual([]);
  });
  it("formata CNJ", () => {
    expect(formatCnj("00009725720235200009")).toBe("0000972-57.2023.5.20.0009");
  });
  it("link do STJ é descartado para processo do TRT", () => {
    expect(linkFonteConfiavel("https://processo.stj.jus.br/processo/pesquisa/?termo=1", "TRT2", "00009725720235200009")).toBeNull();
    expect(linkFonteConfiavel("https://processo.stj.jus.br/x", "STJ", null)).not.toBeNull();
  });
  it("TRT nunca é rotulado como Superior", () => {
    expect(instanciaLabel("superior", "TRT2")).toBe("Regional");
    expect(instanciaLabel("superior", "TST")).toBe("Superior");
  });
  it("esconde relator por código ou gabinete", () => {
    expect(relatorExibivel("Juiz(a) identificado(a) pelo código 185")).toBeNull();
    expect(relatorExibivel("Gabinete da Presidência")).toBeNull();
  });
  it("súmula de nepotismo não é relevante para rescisão indireta", () => {
    expect(sumulaRelevante("rescisão indireta", "A nomeação de cônjuge, companheiro ou parente ... viola a Constituição", null)).toBe(false);
  });
});
